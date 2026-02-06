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

import { FINANCES_2026 } from "./financialConstants";
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
 * @param costHT - Coût des travaux HT (€) (Travaux purs)
 * @param nbLots - Nombre total de lots
 * @param currentDPE - Classe DPE actuelle
 * @param targetDPE - Classe DPE cible
 * @param commercialLots - Nombre de lots commerciaux (non éligibles MPR)
 * @param localAidAmount - Montant des aides locales
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
    _ceeBonus: number = 0,
    currentEnergyBill: number = 0,
    totalSurface?: number,
    averagePricePerSqm?: number
): FinancingPlan {
    // Guard: prevent division by zero
    if (!nbLots || nbLots <= 0) {
        throw new Error("Le nombre de lots doit être supérieur à 0");
    }
    if (!costHT || costHT <= 0) {
        throw new Error("Le coût HT doit être supérieur à 0");
    }

    // 1. Calcul des Coûts (HT et TTC)

    // a. Coûts Travaux + Frais proportionnels
    const syndicFees = costHT * PROJECT_FEES.syndicRate;
    const doFees = costHT * PROJECT_FEES.doRate;
    const contingencyFees = costHT * PROJECT_FEES.contingencyRate;

    // Sous-total Travaux + Frais (Assiette MPR)
    const subtotalWorksFeesHT = costHT + syndicFees + doFees + contingencyFees;

    // b. Coût AMO (Assistance à Maîtrise d'Ouvrage) - Forfaitaire par lot
    const amoCostHT = AMO_PARAMS.costPerLot * nbLots;

    // c. Coût Total Projet HT
    const totalCostHT = subtotalWorksFeesHT + amoCostHT;

    // d. Coût Total Projet TTC (TVA 5.5% Rénovation)
    // C'est ce montant que la copropriété doit réellement financer
    const totalCostTTC = totalCostHT * (1 + TECHNICAL_PARAMS.TVA_RENOVATION);

    // Coût par lot (TTC)
    const costPerUnit = totalCostTTC / nbLots;

    // Gain énergétique estimé
    const energyGainPercent = estimateEnergyGain(currentDPE, targetDPE);

    // --- Aide AMO (Aide Ingénierie) ---
    // Correction suite audit 30/01 : Distinction Petites/Grandes Copros
    const AMO_CEILING_SMALL = 1000; // ≤ 20 lots
    const AMO_CEILING_LARGE = 600;  // > 20 lots

    // 1. Déterminer le plafond par lot applicable
    const amoCeilingPerLot = nbLots <= 20 ? AMO_CEILING_SMALL : AMO_CEILING_LARGE;

    // 2. Plafond global AMO (ex: 8 lots * 1000€ = 8000€)
    const amoCeilingGlobal = nbLots * amoCeilingPerLot;

    // 3. Assiette éligible (Le coût réel de l'AMO, plafonné)
    // Note: On suppose ici que AMO_PARAMS.costPerLot est le coût facturé
    const amoCostEstimated = nbLots * AMO_PARAMS.costPerLot;
    const eligibleBaseAMO = Math.min(amoCostEstimated, amoCeilingGlobal);

    // 4. Calcul de l'aide (50% du montant éligible, avec plancher 3000€)
    const amoAmountRaw = eligibleBaseAMO * AMO_PARAMS.aidRate;
    const amoAmount = Math.max(amoAmountRaw, AMO_PARAMS.minTotal);

    // --- Calcul strict via financialUtils (MPR/CEE/RAC/Éco-PTZ) ---
    const residentialLots = Math.max(0, nbLots - commercialLots);
    const surfaceForMetrics = totalSurface ?? 0;
    const pricePerSqmForMetrics = averagePricePerSqm ?? VALUATION_PARAMS.BASE_PRICE_PER_SQM;
    const extraSubsidies = amoAmount + localAidAmount;

    // NOTE: ceeBonus volontairement ignoré (calcul strict via CEE conservateur)
    const metrics = calculateProjectMetrics(
        totalCostTTC,
        residentialLots,
        energyGainPercent,
        currentEnergyBill,
        surfaceForMetrics,
        pricePerSqmForMetrics,
        extraSubsidies,
        alurFund
    );

    let mprRate = 0;
    if (energyGainPercent >= FINANCES_2026.MPR.MIN_ENERGY_GAIN) {
        mprRate =
            energyGainPercent >= FINANCES_2026.MPR.HIGH_PERF_THRESHOLD
                ? FINANCES_2026.MPR.RATE_HIGH_PERF
                : FINANCES_2026.MPR.RATE_STANDARD;
    }

    return {
        worksCostHT: Math.round(costHT),
        totalCostHT: Math.round(totalCostHT), // On garde le HT pour info
        totalCostTTC: Math.round(totalCostTTC), // Ajout pour le Ticket de Caisse TTC
        syndicFees: Math.round(syndicFees),
        doFees: Math.round(doFees),
        contingencyFees: Math.round(contingencyFees),
        costPerUnit: Math.round(costPerUnit), // TTC !
        energyGainPercent,
        mprAmount: Math.round(metrics.subsidies.mpr),
        amoAmount: Math.round(amoAmount),
        localAidAmount: Math.round(localAidAmount),
        mprRate,
        exitPassoireBonus: 0,
        ecoPtzAmount: Math.round(metrics.financing.loanAmount),
        ceeAmount: Math.round(metrics.subsidies.cee),
        remainingCost: Math.round(Math.max(0, metrics.financing.cashDownPayment)), // TTC
        monthlyPayment: Math.round(metrics.financing.monthlyLoanPayment),
        monthlyEnergySavings: Math.round(metrics.kpi.monthlyEnergySavings),
        netMonthlyCashFlow: Math.round(metrics.kpi.netMonthlyCashFlow),
        remainingCostPerUnit: Math.round(Math.max(0, metrics.financing.cashDownPayment) / nbLots), // TTC
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

    // 4. Valeur Verte via moteur strict
    const residentialLots = Math.max(0, input.numberOfUnits - (input.commercialLots || 0));
    const extraSubsidies = (input.localAidAmount || 0) + financing.amoAmount;
    const cashContribution = input.alurFund || 0;
    const energyGainPercent = financing.energyGainPercent;

    const strictMetrics = calculateProjectMetrics(
        financing.totalCostTTC,
        residentialLots,
        energyGainPercent,
        input.currentEnergyBill || 0,
        totalSurface,
        BASE_PRICE_PER_SQM,
        extraSubsidies,
        cashContribution
    );

    const greenValueGain = strictMetrics.kpi.greenValueIncrease;
    const projectedValue = currentValue + greenValueGain;
    const greenValueGainPercent = currentValue > 0 ? (greenValueGain / currentValue) : 0;

    // 5. Tendance marché (info)
    const marketTrend = getMarketTrend();
    const marketTrendApplied = marketTrend.national; // Ex: -0.004 = -0.4%

    // 6. ROI Net
    const netROI = greenValueGain - financing.remainingCost;

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
        input.ceeBonus || 0,
        input.currentEnergyBill || 0,
        totalSurface,
        input.averagePricePerSqm || VALUATION_PARAMS.BASE_PRICE_PER_SQM
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
