/**
 * VALO-SYNDIC — Moteur de Calcul
 * ==============================
 * Fonctions pures de calcul basées sur les constantes 2026.
 * Aucun état, aucun effet de bord.
 */

import {
    DPE_PROHIBITION_DATES,
    DPE_STATUS_LABELS,
    TECHNICAL_PARAMS,
    PROJECT_FEES,
    AMO_PARAMS,
    VALUATION_PARAMS,
    type DPELetter,
} from "./constants";

import { FINANCES_2026, BAREME_ANAH_2026_IDF, BAREME_ANAH_2026_PROVINCE } from "./financialConstants";
import { calculateProjectMetrics } from "./financialUtils";

import { getMarketTrend } from "./market-data";

import {
    type ComplianceStatus,
    type FinancingPlan,
    type InactionCost,
    type DiagnosticInput,
    type DiagnosticResult,
    type ValuationResult,
    estimateEnergyGain,
} from "./schemas";

// =============================================================================
// 1. STATUT DE CONFORMITÉ (Loi Climat)
// =============================================================================

/**
 * Calcule le statut de conformité réglementaire d'un bien selon son DPE.
 *
 * @param dpeLetter - Classe DPE actuelle (A-G)
 * @param referenceDate - Date de référence pour le calcul (défaut: aujourd'hui)
 * @returns Statut de conformité détaillé
 */
export function calculateComplianceStatus(
    dpeLetter: DPELetter,
    referenceDate: Date = new Date()
): ComplianceStatus {
    const prohibitionDate = DPE_PROHIBITION_DATES[dpeLetter];
    const statusInfo = DPE_STATUS_LABELS[dpeLetter];

    // Pas d'interdiction prévue
    if (prohibitionDate === null) {
        return {
            isProhibited: false,
            prohibitionDate: null,
            daysUntilProhibition: null,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            urgencyLevel: "low",
        };
    }

    const now = referenceDate.getTime();
    const prohibition = prohibitionDate.getTime();
    const diffMs = prohibition - now;
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Déjà interdit
    if (daysUntil <= 0) {
        return {
            isProhibited: true,
            prohibitionDate,
            daysUntilProhibition: 0,
            statusLabel: "INTERDIT",
            statusColor: "danger",
            urgencyLevel: "critical",
        };
    }

    // Interdit dans moins de 2 ans
    if (daysUntil <= 730) {
        return {
            isProhibited: false,
            prohibitionDate,
            daysUntilProhibition: daysUntil,
            statusLabel: statusInfo.label,
            statusColor: "danger",
            urgencyLevel: "high",
        };
    }

    // Interdit dans plus de 2 ans
    return {
        isProhibited: false,
        prohibitionDate,
        daysUntilProhibition: daysUntil,
        statusLabel: statusInfo.label,
        statusColor: "warning",
        urgencyLevel: "medium",
    };
}

// =============================================================================
// 2. SIMULATION DE FINANCEMENT
// =============================================================================

/**
 * Calcule le plan de financement complet pour des travaux de rénovation.
 *
 * @param costHT - Coût des travaux HT (€) (Travaux purs énergétiques — TVA 5.5%)
 * @param nbLots - Nombre total de lots
 * @param currentDPE - Classe DPE actuelle
 * @param targetDPE - Classe DPE cible
 * @param commercialLots - Nombre de lots commerciaux (non éligibles MPR)
 * @param localAidAmount - Montant des aides locales
 * @param alurFund - Fonds ALUR mobilisés
 * @param currentEnergyBill - Facture énergétique annuelle
 * @param totalSurface - Surface totale
 * @param averagePricePerSqm - Prix au m²
 * @param montantHonorairesSyndicHT - Honoraires syndic HT saisis (TVA 20% — Loi 65 Art. 18-1 A)
 *   Si fourni, remplace le calcul forfaitaire (3% de costHT).
 *   Toujours hors assiette MPR/Éco-PTZ — ajouté directement au cashDownPayment.
 * @param montantTravauxAmeliorationHT - Travaux amélioration standard HT (TVA 10%)
 *   Non éligibles MPR/Éco-PTZ — ajoutés directement au cashDownPayment.
 * @returns Plan de financement détaillé
 */
export function simulateFinancing(
    costHT: number,
    nbLots: number,
    currentDPE: DPELetter,
    targetDPE: DPELetter,
    commercialLots: number = 0,
    localAidAmount: number = 0,
    alurFund: number = 0,
    currentEnergyBill: number = 0,
    totalSurface?: number,
    averagePricePerSqm?: number,
    montantHonorairesSyndicHT?: number,   // Optionnel — override du taux forfaitaire 3%
    montantTravauxAmeliorationHT: number = 0,  // Travaux amélioration TVA 10%
    devisValide: boolean = false,              // Conditions Dérogatoire: devis signé avant 31/12/2026
    revenusFonciersExistants: number = 0       // Bailleur: revenus fonciers existants (€/an)
): FinancingPlan {
    // Guard: prevent division by zero
    if (!nbLots || nbLots <= 0) {
        throw new Error("Le nombre de lots doit être supérieur à 0");
    }
    if (!costHT || costHT <= 0) {
        throw new Error("Le coût HT doit être supérieur à 0");
    }

    // ==========================================================
    // 1. TICKET DE CAISSE HT — Lignes séparées (pas d'addition aveugle)
    // ==========================================================
    //
    // - Travaux énergétiques    : TVA 5.5% (Art. 279-0 bis)
    // - Honoraires Syndic       : TVA 20%  (régime normal)
    // - Assurance DO            : Taxe conv. assurance 9% (Art. 991 CGI)
    // - Provision Aléas        : NEUTRE — provision HT, pas de TVA
    // - AMO (Ingénierie)       : TVA 20%  (régime normal)

    // Honoraires syndic HT : priorité au montant saisi, sinon taux forfaitaire 3%
    // (Loi 65, Art. 18-1 A — TVA 20% — STRICTEMENT hors assiette MPR/Éco-PTZ)
    const syndicFees = montantHonorairesSyndicHT ?? (costHT * PROJECT_FEES.syndicRate); // HT
    const doFees = costHT * PROJECT_FEES.doRate;           // HT assiette
    const contingencyFees = costHT * PROJECT_FEES.contingencyRate;  // provision HT

    // b. AMO (Assistance à Maîtrise d'Ouvrage) — Forfaitaire par lot
    const amoCostHT = AMO_PARAMS.costPerLot * nbLots;

    // c. Travaux amélioration standard (TVA 10%) — hors énergétiques
    const ameliorationHT = Math.max(0, montantTravauxAmeliorationHT);

    // F1 — totalCostHT = addition exacte des lignes HT (avant TVA)
    const totalCostHT = costHT + syndicFees + doFees + contingencyFees + amoCostHT + ameliorationHT;

    // F2 — TTC ligne par ligne (règle stricte de non-mélange HT/TTC — BOI-TVA-LIQ-30-20-95)
    const worksTTC = costHT * (1 + FINANCES_2026.TVA.TRAVAUX);             // 5.5%
    const syndicTTC = syndicFees * (1 + FINANCES_2026.TVA.HONORAIRES);      // 20%
    const doTTC = doFees * (1 + FINANCES_2026.TVA.ASSURANCE_DO);            // 9%
    // FIX AUDIT FEV 2026 : TVA latente 5.5% sur aléas — si la provision est consommée pour
    // des travaux, elle sera taxée (Art. 279-0 bis CGI). Le budget TTC doit intégrer cette
    // TVA latente pour éviter tout appel de fonds complémentaire en fin de chantier.
    const contingencyTTC = contingencyFees * (1 + FINANCES_2026.TVA.TRAVAUX);  // 5.5%
    const amoTTC = amoCostHT * (1 + FINANCES_2026.TVA.HONORAIRES);            // 20%
    const ameliorationTTC = ameliorationHT * (1 + FINANCES_2026.TVA.AMELIORATION); // 10%
    // totalCostTTC : base complète (hors TVA déjà incluse dans honoraires/amélioration)
    const totalCostTTC = worksTTC + syndicTTC + doTTC + contingencyTTC + amoTTC + ameliorationTTC;

    // Coût par lot (TTC)
    const costPerUnit = totalCostTTC / nbLots;

    // Gain énergétique estimé
    const energyGainPercent = estimateEnergyGain(currentDPE, targetDPE);

    // ==========================================================
    // 2. AMO : Subvention ANAH 50% (Art. L. 321-1)
    // ==========================================================
    // L'ANAH subventionne 50% de la prestation AMO, plafonnée.
    // Le reste (amoNetCostHT) reste à la charge de la copropriété.
    const amoCeilingPerLot = nbLots <= AMO_PARAMS.smallCoproThreshold
        ? AMO_PARAMS.ceilingPerLotSmall
        : AMO_PARAMS.ceilingPerLotLarge;
    const amoCeilingGlobal = nbLots * amoCeilingPerLot;
    const eligibleBaseAMO = Math.min(amoCostHT, amoCeilingGlobal);
    // FIX AUDIT FEV 2026 (S3) : plafonnement de la subvention AMO à 100% du coût réel
    // L'ANAH ne peut pas subventionner au-delà du coût du service réellement facturé.
    // Le plancher de 3 000€ peut dépasser le coût AMO pour les toutes petites copros (< 6 lots).
    const amoSubvention = Math.min(
        Math.max(eligibleBaseAMO * AMO_PARAMS.aidRate, AMO_PARAMS.minTotal),
        amoCostHT  // Cap à 100% du coût réel
    );
    const amoNetCostHT = Math.max(0, amoCostHT - amoSubvention);  // Restant finançable
    const amoAmount = amoSubvention; // Alias pour la sortie (subvention, pas le coût)

    // ==========================================================
    // 3. MPR + BONUS SORTIE PASSOIRE (Art. D. 321-13 et suivants)
    // ==========================================================
    const residentialLots = Math.max(0, nbLots - commercialLots);
    const surfaceForMetrics = totalSurface ?? 0;
    const pricePerSqmForMetrics = averagePricePerSqm ?? VALUATION_PARAMS.BASE_PRICE_PER_SQM;

    // Le taux MPR de base
    let baseMprRate = 0;
    if (energyGainPercent >= FINANCES_2026.MPR.MIN_ENERGY_GAIN) {
        baseMprRate = energyGainPercent >= FINANCES_2026.MPR.HIGH_PERF_THRESHOLD
            ? FINANCES_2026.MPR.RATE_HIGH_PERF
            : FINANCES_2026.MPR.RATE_STANDARD;
    }

    // Bonus "Sortie de Passoire" (F5) : F ou G → D ou mieux
    const PASSOIRE_DEPARTS = ['F', 'G'] as const;
    const PASSOIRE_CIBLES = ['A', 'B', 'C', 'D'] as const;
    const isExitPassoire = PASSOIRE_DEPARTS.includes(currentDPE as 'F' | 'G') &&
        PASSOIRE_CIBLES.includes(targetDPE as 'A' | 'B' | 'C' | 'D');
    const bonusPassoire = isExitPassoire ? FINANCES_2026.MPR.BONUS_SORTIE_PASSOIRE : 0;
    const mprRate = baseMprRate + bonusPassoire;
    const exitPassoireBonus = bonusPassoire;

    // F4 — Assiette Éco-PTZ = travaux éligibles uniquement (CGI Art. 244 quater U)
    // Inclut : travaux énergétiques HT + AMO nette HT (prîstations d'ingénierie)
    // Exclut : honoraires syndic, DO, aléas (non finançables)
    const ecoPtzEligibleHT = costHT + amoNetCostHT;

    // Toutes les aides supplémentaires (hors MPR/CEE = dans le moteur)
    const extraSubsidies = amoSubvention + localAidAmount;

    // Fonds Travaux ALUR : mobilisés en déduction visible avant prêt
    const fondsTravauxMobilise = alurFund;

    const metrics = calculateProjectMetrics(
        costHT,              // Assiette MPR et CEE
        totalCostTTC,        // Assiette RAC totale TTC
        residentialLots,
        energyGainPercent,
        currentEnergyBill,
        surfaceForMetrics,
        pricePerSqmForMetrics,
        extraSubsidies,
        fondsTravauxMobilise,
        ecoPtzEligibleHT,    // Assiette Éco-PTZ éligible (CGI Art. 244 quater U)
        mprRate              // Taux final incluant bonus sortie passoire si applicable
    );

    // ==========================================================
    // 4. OBJET PAR LOT (AG Slide) — calculé après waterfall en section 6
    // ==========================================================
    const valeurVerteParLot = Math.round(metrics.kpi.greenValueIncrease / nbLots);

    // ==========================================================
    // 5. DÉFICIT FONCIER — ONE-SHOT Année 1 (CGI Art. 156-I-3° — LdF 2026)
    // ==========================================================
    //
    // L'assiette déductible exclut :
    //   - Provision Aléas (dépense incertaine, non engagée — BOI-RFPI-BASE-20-60)
    //   - Les subventions reçues (MPR, CEE, AMO, aides locales)
    //   - Les travaux amélioration standard (hors rénovation énergétique, critère DF strict)
    // Cohérence HT/TTC : on soustrait les TTC des postes exclus d'une base TTC.
    const assietteEligibleDfTotal = totalCostTTC
        - contingencyTTC      // Exclu — provision aléatoire non engagée
        - ameliorationTTC     // Exclu — travaux amélioration hors réno énergétique
        - syndicTTC           // Exclu — honoraires de gestion (non déductibles comme charges Art. 31)
        - metrics.subsidies.mpr
        - metrics.subsidies.cee
        - amoSubvention
        - localAidAmount;

    const assietteEligibleDfParLot = Math.max(0, assietteEligibleDfTotal / nbLots);

    // ── Plafond dérogatoire 21 400 € — 3 conditions CUMULATIVES (BOFiP mai 2026) ──
    // 1. DPE initial : F ou G (passoire thermique)
    // 2. DPE projeté : A, B, C ou D (sortie de passoire validée)
    // 3. Devis signé avant le 31/12/2026 (condition suspensive LdF 2026)
    // Si l'une manque → plafond standard 10 700 €
    const PASSOIRE_INITIALES = ['F', 'G'] as const;
    const CIBLES_VALIDES_DF = ['A', 'B', 'C', 'D'] as const;
    const eligibleDerogatoire =
        PASSOIRE_INITIALES.includes(currentDPE as 'F' | 'G') &&
        CIBLES_VALIDES_DF.includes(targetDPE as 'A' | 'B' | 'C' | 'D') &&
        (devisValide === true);

    const plafondApplicable = eligibleDerogatoire
        ? FINANCES_2026.DEFICIT_FONCIER.PLAFOND_DEROGATOIRE  // 21 400 €
        : FINANCES_2026.DEFICIT_FONCIER.PLAFOND_STANDARD;    // 10 700 €

    // Imputation sur le revenu global (plafonnée) → économie = TMI seule
    const imputationRevenuGlobal = Math.min(assietteEligibleDfParLot, plafondApplicable);
    const economieSurRevenuGlobal = imputationRevenuGlobal * FINANCES_2026.DEFICIT_FONCIER.TMI_DEFAULT;

    // Excédent + revenus fonciers existants → économie = TMI + PS (17.2%)
    // Les revenus fonciers existants permettent d'absorber la totalité du déficit y compris le plafond.
    const rfExistants = Math.max(0, revenusFonciersExistants);
    const excedentDF = Math.max(0, assietteEligibleDfParLot - plafondApplicable);
    const baseRevenusFonciers = excedentDF + rfExistants;
    const economieSurRevenusFonciers = baseRevenusFonciers * FINANCES_2026.DEFICIT_FONCIER.TAUX_EFFECTIF;

    const avantagesFiscauxAnnee1 = Math.round(economieSurRevenuGlobal + economieSurRevenusFonciers);

    // ==========================================================
    // 6. WATERFALL — Ventilation finale du cashDownPayment
    // ==========================================================
    // Le cashDownPayment issu du moteur (éco-PTZ) ne contient pas encore :
    //   - ameliorationTTC (TVA 10%) — non éligible Éco-PTZ, appel de fonds direct
    //   - syndicTTC (TVA 20%)       — hors tout prêt/subv. (Loi 65, Art. 18-1 A)
    // Ces postes sont toujours appelés en AG, jamais financés par l'Éco-PTZ.
    const cashDownTotal = Math.round(metrics.financing.cashDownPayment + ameliorationTTC + syndicTTC);
    const racBrutParLot = Math.round((metrics.financing.initialRac + ameliorationTTC + syndicTTC) / nbLots);
    const racComptantParLot = Math.round(cashDownTotal / nbLots);

    const perUnit = {
        // Avertissement AG obligatoire : à recalculer selon millièmes du règlement
        coutParLotTTC: Math.round(totalCostTTC / nbLots),
        mprParLot: Math.round(metrics.subsidies.mpr / Math.max(1, residentialLots)),
        ceeParLot: Math.round(metrics.subsidies.cee / Math.max(1, residentialLots)),
        ecoPtzParLot: Math.round(metrics.financing.loanAmount / nbLots),
        mensualiteParLot: Math.round(metrics.financing.monthlyLoanPayment / nbLots),
        cashflowNetParLot: Math.round(metrics.kpi.netMonthlyCashFlow / nbLots),
        racBrutParLot,               // RAC brut incluant amélioration + honoraires syndic
        racComptantParLot,           // Appel immédiat en AG (hors Éco-PTZ)
        avantagesFiscauxAnnee1,      // Économie fiscale Bailleur (CGI Art. 31 & 156)
        valeurVerteParLot,
    };

    return {
        worksCostHT: Math.round(costHT),
        totalCostHT: Math.round(totalCostHT),
        totalCostTTC: Math.round(totalCostTTC),
        syndicFees: Math.round(syndicFees),
        doFees: Math.round(doFees),
        contingencyFees: Math.round(contingencyFees),
        costPerUnit: Math.round(costPerUnit),
        energyGainPercent,
        mprAmount: Math.round(metrics.subsidies.mpr),
        amoAmount: Math.round(amoAmount),
        amoCostTTC: Math.round(amoTTC),
        localAidAmount: Math.round(localAidAmount),
        mprRate,
        exitPassoireBonus,
        ecoPtzAmount: Math.round(metrics.financing.loanAmount),
        ceeAmount: Math.round(metrics.subsidies.cee),
        remainingCost: Math.round(metrics.financing.initialRac + ameliorationTTC + syndicTTC),
        cashDownPayment: cashDownTotal,
        monthlyPayment: Math.round(metrics.financing.monthlyLoanPayment),
        monthlyEnergySavings: Math.round(metrics.kpi.monthlyEnergySavings),
        netMonthlyCashFlow: Math.round(metrics.kpi.netMonthlyCashFlow),
        remainingCostPerUnit: racBrutParLot,
        perUnit,
        alerts: metrics.alerts,
    };
}

// =============================================================================
// 3. COÛT DE L'INACTION
// =============================================================================

/**
 * Calcule le coût de l'inaction sur 3 ans.
 *
 * @param currentCost - Coût actuel des travaux (€)
 * @param averagePricePerSqm - Prix moyen au m² (optionnel)
 * @param averageUnitSurface - Surface moyenne d'un lot en m² (optionnel)
 * @param nbLots - Nombre de lots
 * @param currentDPE - DPE actuel pour évaluer la perte de valeur
 * @returns Coût de l'inaction détaillé
 */
export function calculateInactionCost(
    currentCost: number,
    nbLots: number,
    currentDPE: DPELetter,
    averagePricePerSqm?: number,
    averageUnitSurface?: number
): InactionCost {
    const inflationRate = TECHNICAL_PARAMS.constructionInflationRate;
    const greenValueDrift = TECHNICAL_PARAMS.greenValueDrift;

    // 1. Surcoût Travaux (Inflation BTP composée sur 3 ans)
    const projectedCost3Years = currentCost * Math.pow(1 + inflationRate, 3);
    const inflationCost = projectedCost3Years - currentCost;

    // 2. Érosion Vénale (L'écart de valeur se creuse)
    let valueDepreciation = 0;

    if (averagePricePerSqm && averageUnitSurface) {
        // Seuls les DPE F et G subissent une décote significative qui s'aggrave
        if (currentDPE === "F" || currentDPE === "G") {
            const totalSurface = averageUnitSurface * nbLots;
            const currentValue = averagePricePerSqm * totalSurface;

            // On estime que la "décote" (le malus) s'aggrave de 1.5% par an
            // C'est la "double peine" : non seulement on paie plus cher après, 
            // mais le bien perd du terrain par rapport au marché rénové.
            const driftFactor = Math.pow(1 + greenValueDrift, 3) - 1;

            // Base de calcul de la décote : on prend une fraction de la valeur totale (ex: 10% de décote de base)
            // et on applique le drift sur cette décote ou sur la valeur ?
            // Le prompt dit : "La 'Valeur Verte' (écart de prix) augmente de 1.5% par an."
            // Donc si l'écart est de 10%, il passe à 10% * 1.015^3 ? Ou 10% + 3*1.5% ? 
            // Interprétons : L'écart se creuse. Si je ne fais rien, je rate ce train.
            // Simplification : On applique le drift sur la valeur totale considérée comme "à risque".
            // Mais restons conservateurs comme demandé : "Hypothèse conservatrice : La Valeur Verte augmente de 1.5%/an".
            // Donc on calcule la Valeur Verte Potentielle (Ex: 10% du prix), et on dit qu'on perd le drift dessus.

            const potentialGreenValue = currentValue * TECHNICAL_PARAMS.greenValueAppreciation; // ~12%
            valueDepreciation = potentialGreenValue * driftFactor;
        }
    }

    return {
        currentCost,
        projectedCost3Years,
        valueDepreciation, // C'est ici le coût de "l'érosion supplémentaire"
        totalInactionCost: inflationCost + valueDepreciation,
    };
}

// =============================================================================
// 4. DIAGNOSTIC COMPLET
// =============================================================================

/**
 * Calcule la valorisation patrimoniale et la Valeur Verte
 *
 * AUDIT 31/01/2026: Intégration de la tendance marché
 * - Utilise les données réelles du marché (market_data.json)
 * - La valeur projetée tient compte de la tendance
 * - Transparence sur les sources de calcul
 */
export function calculateValuation(
    input: DiagnosticInput,
    financing: FinancingPlan
): ValuationResult {
    // 1. Estimation de la surface
    // Si la surface moyenne n'est pas connue, on l'estime à 65m2 par lot
    const averageSurface = input.averageUnitSurface || 65;
    const totalSurface = input.numberOfUnits * averageSurface;

    // 2. Prix de base au m2 (priorité à l'input, sinon fallback conservateur)
    const BASE_PRICE_PER_SQM = input.averagePricePerSqm || VALUATION_PARAMS.BASE_PRICE_PER_SQM;

    // 3. Valeur actuelle (sans surcote DPE)
    const currentValue = totalSurface * BASE_PRICE_PER_SQM;

    // 4. Valeur Verte — taux conditionnel selon la performance énergétique atteinte
    // FIX AUDIT FEV 2026 (F3) : aligné sur la logique de calculateProjectMetrics/financialUtils
    // pour éviter l'incohérence entre les deux moteurs (12% toujours vs 12%/8%/0% conditionnel)
    const energyGain = financing.energyGainPercent;
    const greenValueGainPercent =
        energyGain >= FINANCES_2026.MPR.HIGH_PERF_THRESHOLD
            ? TECHNICAL_PARAMS.greenValueAppreciation           // 12% (haute performance, gain > 50%)
            : energyGain >= FINANCES_2026.MPR.MIN_ENERGY_GAIN
                ? TECHNICAL_PARAMS.greenValueAppreciationStandard // 8%  (standard, gain 35-50%)
                : 0;                                              // 0%  (non éligible, gain < 35%)
    const greenValueGain = currentValue * greenValueGainPercent;
    const projectedValue = currentValue + greenValueGain;

    // 5. Tendance marché (info)
    const marketTrend = getMarketTrend();
    const marketTrendApplied = marketTrend.national; // Ex: -0.004 = -0.4%

    // 6. ROI Net (Gain de valeur verte - Décaissement cash effectif des copropriétaires)
    // Le coût réel = uniquement l'apport comptant immédiat (cashDownPayment).
    // L'Éco-PTZ est un prêt remboursé progressivement : l'additionner au RAC serait
    // un double-comptage qui sous-estime le ROI patrimonial.
    // FIX AUDIT FEV 2026 (F2) : réalisé avec cashDownPayment au lieu de ecoPtzAmount + remainingCost
    const realCost = financing.cashDownPayment;
    const netROI = greenValueGain - realCost;

    // Détection fossile
    const isFossilFuel = input.heatingSystem
        ? ['gaz', 'fioul'].includes(input.heatingSystem)
        : false;

    return {
        currentValue,
        projectedValue,
        marketTrendApplied,
        greenValueGain,
        greenValueGainPercent,
        netROI,
        pricePerSqm: BASE_PRICE_PER_SQM,
        priceSource: input.priceSource,
        salesCount: input.salesCount,
        isFossilFuel,
    };
}

/**
 * Génère un diagnostic complet à partir des entrées utilisateur.
 *
 * @param input - Données d'entrée validées
 * @returns Résultat complet du diagnostic
 */
export function generateDiagnostic(input: DiagnosticInput): DiagnosticResult {
    // 1. Calcul conformité
    const compliance = calculateComplianceStatus(input.currentDPE);

    // 2. Simulation financement
    // AUDIT 02/02/2026: Logic Priorité Coût Manuel vs Auto
    const averageSurface = input.averageUnitSurface || 65;
    const totalSurface = input.numberOfUnits * averageSurface;

    let workCostBase = input.estimatedCostHT;

    // Si pas de coût saisi (ou 0), on estime automatiquement
    if (!workCostBase || workCostBase <= 0) {
        workCostBase = totalSurface * VALUATION_PARAMS.ESTIMATED_RENO_COST_PER_SQM;
    }

    const financing = simulateFinancing(
        workCostBase,
        input.numberOfUnits,
        input.currentDPE,
        input.targetDPE,
        input.commercialLots,
        input.localAidAmount,
        input.alurFund || 0,
        input.currentEnergyBill || 0,
        totalSurface,
        input.averagePricePerSqm || VALUATION_PARAMS.BASE_PRICE_PER_SQM,
        input.montantHonorairesSyndicHT,            // TVA 20% — hors subv./prêt (Loi 65)
        input.montantTravauxAmeliorationHT ?? 0,    // TVA 10% — hors éligibilité MPR/Éco-PTZ
        input.devisValide ?? false,                  // Condition suspensive plafond 21 400 €
        input.revenusFonciersExistants ?? 0          // Bailleur — revenus fonciers existants
    );

    // 3. Coût de l'inaction
    const inactionCost = calculateInactionCost(
        workCostBase,
        input.numberOfUnits,
        input.currentDPE,
        input.averagePricePerSqm,
        input.averageUnitSurface
    );

    // 4. Valorisation
    const valuation = calculateValuation(input, financing);

    return {
        input,
        compliance,
        financing,
        inactionCost,
        valuation,
        generatedAt: new Date(),
    };
}

// =============================================================================
// 5. UTILITAIRES DE FORMATAGE
// =============================================================================

/**
 * Formate un montant en euros avec séparateur de milliers.
 */
export function formatCurrency(amount: number): string {
    const useDecimals = Math.abs(amount) < 1000 && amount !== 0;

    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: useDecimals ? 2 : 0,
        minimumFractionDigits: useDecimals ? 2 : 0,
    }).format(amount).replace(/[\u200B\u202F\u00A0]/g, " "); // Replace non-breaking spaces with normal spaces for PDF safety
}

/**
 * Formate un pourcentage.
 */
export function formatPercent(value: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "percent",
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Formate une date en français.
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

/**
 * Nettoie le texte pour l'affichage PDF (supprime les accents)
 * Solution de repli pour éviter les problèmes d'encodage avec Helvetica
 */
export function sanitizeText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Enlève les accents
        .replace(/€/g, "EUR"); // Remplace € par EUR si besoin (optionnel, mais Helvetica gère mal € parfois)
}

// =============================================================================
// 6. GOD VIEW (AUDIT DE PARC)
// =============================================================================

/**
 * Estime le DPE probable d'une copropriété en fonction de son année de construction
 */
export function estimateDPEByYear(constructionYear: number): DPELetter {
    if (constructionYear < 1948) return "G";
    if (constructionYear <= 1974) return "F"; // Avant premier choc pétrolier
    if (constructionYear <= 1989) return "E"; // Premières RT
    if (constructionYear <= 2000) return "D";
    if (constructionYear <= 2010) return "C"; // RT 2005
    if (constructionYear <= 2020) return "B"; // RT 2012
    return "A"; // RE 2020
}

export interface BuildingAuditResult {
    id: string;
    address: string;
    numberOfUnits: number;
    constructionYear: number;
    currentDPE: DPELetter;
    compliance: {
        status: "danger" | "warning" | "success";
        label: string;
        deadline?: string;
    };
    coordinates: [number, number]; // [lat, lng]
}
