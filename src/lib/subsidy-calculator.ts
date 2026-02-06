/**
 * MaPrimeRénov' Copropriété 2026 — Moteur de Calcul des Aides
 * ===========================================================
 * Règles officielles Service-Public.fr établies au 01/01/2026.
 * 
 * @see https://www.service-public.fr/particuliers/vosdroits/F35083
 */

import { AMO_PARAMS, MPR_COPRO } from "./constants";

// =============================================================================
// 1. TYPES & PROFILS DE REVENUS
// =============================================================================

/**
 * Profil de revenus selon barème MaPrimeRénov' 2026
 * - BLEU (Très modeste): Anah catégorie 1
 * - JAUNE (Modeste): Anah catégorie 2
 * - VIOLET (Intermédiaire): Anah catégorie 3
 * - ROSE (Aisé): Au-dessus des plafonds
 */
export type IncomeProfile = 'Blue' | 'Yellow' | 'Purple' | 'Pink';

/**
 * Données d'entrée pour la simulation
 */
export interface SimulationInputs {
    /** Montant total des travaux HT (global copropriété) */
    workAmountHT: number;

    /** Montant AMO HT (global copropriété) */
    amoAmountHT: number;

    /** Nombre total de lots dans la copropriété */
    nbLots: number;

    /** Gain énergétique estimé (en pourcentage, ex: 0.45 pour 45%) */
    energyGain: number;

    /** DPE initial (lettre A-G) */
    initialDPE: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

    /** DPE cible après travaux */
    targetDPE: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

    /** Copropriété fragile (bonus social exceptionnel) */
    isFragile?: boolean;

    /** CEE (Certificats Économie Énergie) par lot - Aide privée (Total, EDF...) */
    ceePerLot?: number;

    /** Aides locales par lot (Abondements Angers Loire Métropole, Région...) */
    localAidPerLot?: number;
}

/**
 * Détail des aides pour un copropriétaire
 */
export interface SubsidyBreakdown {
    /** Profil de revenus */
    profile: IncomeProfile;

    /** Quote-part travaux avant aides (€) */
    workShareBeforeAid: number;

    /** Montant MPR Copro (Travaux) + Bonus */
    mprCoProAmount: number;

    /** Détail du taux MPR appliqué (pour transparence) */
    mprRate: number;

    /** Bonus Sortie Passoire appliqué (€) */
    passoireBonusAmount: number;

    /** Bonus Fragile appliqué (€) */
    fragileBonusAmount: number;

    /** Part AMO (Assistance à Maîtrise d'Ouvrage) */
    amoShareAmount: number;

    /** Prime individuelle selon revenus (€) */
    individualPremium: number;

    /** Total des aides publiques (MPR + AMO + Prime) */
    totalPublicSubsidies: number;

    /** CEE (Certificats Économie Énergie) par lot */
    ceeAmount: number;

    /** Aides locales par lot (Abondements) */
    localAidAmount: number;

    /** Boost Privé/Local (CEE + Aides Locales) */
    privateLocalBoost: number;

    /** Total des aides (Publiques + Privées/Locales) */
    totalSubsidies: number;

    /** Reste à charge final (€) */
    remainingCost: number;

    /** Effort mensuel estimé (Éco-PTZ 20 ans, 0% taux zéro) */
    monthlyPayment: number;
}

/**
 * Résultat de simulation pour tous les profils
 */
export interface SubsidyResult {
    /** Inputs de la simulation */
    inputs: SimulationInputs;

    /** Résultats pour chaque profil */
    profiles: {
        Blue: SubsidyBreakdown;
        Yellow: SubsidyBreakdown;
        Purple: SubsidyBreakdown;
        Pink: SubsidyBreakdown;
    };
}

// =============================================================================
// 2. CONSTANTES RÈGLEMENTAIRES 2026
// =============================================================================

/** 
 * Barèmes de revenus Hors Île-de-France (Année 2026)
 * Source: Anah / Service-Public.fr
 */
export const INCOME_THRESHOLDS_OUTSIDE_IDF = {
    /** BLEU - Très Modeste (Revenu fiscal de référence ≤) */
    Blue: {
        1: 17_363,
        2: 25_458,
        3: 30_594,
        4: 35_732,
        5: 40_905,
        perAdditionalPerson: 5_174,
    },
    /** JAUNE - Modeste (Revenu fiscal de référence ≤) */
    Yellow: {
        1: 22_461,
        2: 32_967,
        3: 39_621,
        4: 46_274,
        5: 52_941,
        perAdditionalPerson: 6_665,
    },
    /** VIOLET - Intermédiaire (Revenu fiscal de référence ≤) */
    Purple: {
        1: 30_549,
        2: 44_907,
        3: 54_071,
        4: 63_235,
        5: 72_400,
        perAdditionalPerson: 9_165,
    },
    /** ROSE - Au-dessus des plafonds */
} as const;

/** 
 * Constantes MPR importées de constants.ts
 * Plafond d'assiette MPR par logement (€ HT) = 25_000
 */
const MPR_CEILING_PER_UNIT = MPR_COPRO.ceilingPerUnit;

/** 
 * Taux de base MPR selon gain énergétique 
 * Importés depuis constants.ts
 */
const MPR_BASE_RATES = MPR_COPRO.rates;

/** 
 * Bonus Sortie de Passoire (F/G → D ou mieux)
 * Importé depuis constants.ts 
 */
const PASSOIRE_BONUS_RATE = MPR_COPRO.exitPassoireBonus;

/** Bonus Fragile (copropriétés en difficulté) - +20% */
const FRAGILE_BONUS_RATE = 0.20;

/** 
 * AMO - Plafonds et taux
 * Importés depuis constants.ts pour garantir la cohérence
 */
const AMO_PARAMS_LOCAL = {
    /** Taux de prise en charge AMO (50%) */
    rate: AMO_PARAMS.aidRate,
    /** Plafond si copro ≤ 20 lots (1 000€) */
    ceilingSmallCopro: AMO_PARAMS.ceilingPerLotSmall,
    /** Plafond si copro > 20 lots (600€) */
    ceilingLargeCopro: AMO_PARAMS.ceilingPerLotLarge,
    /** Seuil de distinction petite/grande copro */
    smallCoproThreshold: AMO_PARAMS.smallCoproThreshold,
    /** Plancher global minimum (3 000€) */
    minTotal: AMO_PARAMS.minTotal,
} as const;

/** Primes individuelles par profil (€) */
const INDIVIDUAL_PREMIUMS: Record<IncomeProfile, number> = {
    Blue: 3_000,
    Yellow: 1_500,
    Purple: 0,
    Pink: 0,
} as const;

/** 
 * Paramètres Éco-PTZ Copropriété 2026
 * Source: ANAH / Bercy - Prêt à taux 0%
 */
const ECO_PTZ_PARAMS = {
    /** Durée du prêt en années */
    durationYears: 20,
    /** Taux nominal annuel Éco-PTZ (0% - prêt aidé) */
    nominalRate: 0.00,
} as const;

// =============================================================================
// 3. FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Détermine le profil de revenus à partir du RFR et de la taille du foyer
 * (Fonction de référence pour usage futur)
 */
export function determineIncomeProfile(
    householdSize: number,
    annualIncome: number
): IncomeProfile {
    const thresholds = INCOME_THRESHOLDS_OUTSIDE_IDF;

    // Calcul du plafond effectif pour plus de 5 personnes
    const getThreshold = (profile: keyof typeof thresholds, size: number): number => {
        const data = thresholds[profile];
        if (size <= 5) {
            return data[size as keyof typeof data] as number;
        }
        const base = data[5] as number;
        const additional = (size - 5) * data.perAdditionalPerson;
        return base + additional;
    };

    if (annualIncome <= getThreshold('Blue', householdSize)) return 'Blue';
    if (annualIncome <= getThreshold('Yellow', householdSize)) return 'Yellow';
    if (annualIncome <= getThreshold('Purple', householdSize)) return 'Purple';
    return 'Pink';
}

/**
 * Calcule la mensualité d'un prêt à taux fixe
 */
function calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    years: number
): number {
    if (principal <= 0 || annualRate < 0) return 0;

    // Éco-PTZ: taux 0%, mensualité = capital / durée
    if (annualRate === 0) {
        return principal / (years * 12);
    }

    const monthlyRate = annualRate / 12;
    const numberOfPayments = years * 12;

    // Formule classique de mensualité
    const monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
}

/**
 * Vérifie si le projet est une "Sortie de Passoire"
 */
function isSortiePassoire(initial: string, target: string): boolean {
    const DPE_VALUES: Record<string, number> = {
        G: 1, F: 2, E: 3, D: 4, C: 5, B: 6, A: 7,
    };

    const isPassoire = initial === 'F' || initial === 'G';
    const targetValue = DPE_VALUES[target];
    const dValue = DPE_VALUES['D'];

    if (targetValue === undefined || dValue === undefined) return false;

    const targetIsDecent = targetValue >= dValue;

    return isPassoire && targetIsDecent;
}

// =============================================================================
// 4. MOTEUR DE CALCUL PRINCIPAL
// =============================================================================

/**
 * Calcule les aides MaPrimeRénov' Copropriété 2026 pour tous les profils
 * 
 * @param inputs - Paramètres de simulation
 * @returns Détail des aides pour chaque profil de revenus
 */
export function calculateSubsidies(inputs: SimulationInputs): SubsidyResult {
    const {
        workAmountHT,
        amoAmountHT,
        nbLots,
        energyGain,
        initialDPE,
        targetDPE,
        isFragile = false,
        ceePerLot = 0,
        localAidPerLot = 0,
    } = inputs;

    // =========================================================================
    // ÉTAPE 1: Calcul de la Quote-part Travaux par Logement
    // =========================================================================

    const workSharePerUnit = workAmountHT / nbLots;

    // Plafonnement à 25 000 € HT par logement
    const eligibleWorkSharePerUnit = Math.min(workSharePerUnit, MPR_CEILING_PER_UNIT);

    // =========================================================================
    // ÉTAPE 2: Taux MPR de Base (selon gain énergétique)
    // =========================================================================

    let baseRate = 0;

    if (energyGain >= 0.50) {
        baseRate = MPR_BASE_RATES.performance; // 45%
    } else if (energyGain >= 0.35) {
        baseRate = MPR_BASE_RATES.standard; // 30%
    }
    // Sinon 0% (non éligible)

    // =========================================================================
    // ÉTAPE 3: Bonus Sortie de Passoire (+10%)
    // =========================================================================

    const passoireBonus = isSortiePassoire(initialDPE, targetDPE)
        ? PASSOIRE_BONUS_RATE
        : 0;

    // =========================================================================
    // ÉTAPE 4: Bonus Fragile (+20%)
    // =========================================================================

    const fragileBonus = isFragile ? FRAGILE_BONUS_RATE : 0;

    // =========================================================================
    // ÉTAPE 5: Taux Total MPR
    // =========================================================================

    const totalMprRate = baseRate + passoireBonus + fragileBonus;

    // Montant MPR Travaux par logement
    const mprWorkAmountPerUnit = eligibleWorkSharePerUnit * totalMprRate;

    // Détail des bonus en euros (pour affichage)
    const passoireBonusAmountPerUnit = eligibleWorkSharePerUnit * passoireBonus;
    const fragileBonusAmountPerUnit = eligibleWorkSharePerUnit * fragileBonus;

    // =========================================================================
    // ÉTAPE 6: Aide AMO (Assistance à Maîtrise d'Ouvrage)
    // Source: https://www.economie.gouv.fr/particuliers/maprimerenov-copropriete
    // =========================================================================

    const amoSharePerUnit = amoAmountHT / nbLots;

    // Plafond AMO selon taille copro (≤20 lots: 1000€/lot, >20 lots: 600€/lot)
    const amoCeiling = nbLots <= AMO_PARAMS_LOCAL.smallCoproThreshold
        ? AMO_PARAMS_LOCAL.ceilingSmallCopro
        : AMO_PARAMS_LOCAL.ceilingLargeCopro;

    const eligibleAmoPerUnit = Math.min(amoSharePerUnit, amoCeiling);
    const amoAmountPerUnit = eligibleAmoPerUnit * AMO_PARAMS_LOCAL.rate;

    // Vérification du plancher global (3000€ minimum)
    const amoTotalGlobal = amoAmountPerUnit * nbLots;
    const amoAmountPerUnitFinal = Math.max(
        amoAmountPerUnit,
        AMO_PARAMS_LOCAL.minTotal / nbLots
    );

    // =========================================================================
    // ÉTAPE 7: Calcul pour chaque profil
    // =========================================================================

    const profiles = {} as SubsidyResult['profiles'];

    for (const profile of ['Blue', 'Yellow', 'Purple', 'Pink'] as IncomeProfile[]) {
        // Prime individuelle selon revenus
        const individualPremium = INDIVIDUAL_PREMIUMS[profile];

        // Total des aides publiques (MPR + AMO + Prime)
        const totalPublicSubsidies =
            mprWorkAmountPerUnit +
            amoAmountPerUnitFinal +
            individualPremium;

        // Boost Privé/Local (CEE + Aides Locales)
        const ceeAmount = ceePerLot;
        const localAidAmount = localAidPerLot;
        const privateLocalBoost = ceeAmount + localAidAmount;

        // Total des aides (Publiques + Privées/Locales)
        const totalSubsidies = totalPublicSubsidies + privateLocalBoost;

        // Reste à charge (ne peut pas être négatif)
        const totalCostPerUnit = workSharePerUnit + amoSharePerUnit;
        const remainingCost = Math.max(0, totalCostPerUnit - totalSubsidies);

        // Effort mensuel (Éco-PTZ 20 ans, 0% taux zéro)
        const monthlyPayment = calculateMonthlyPayment(
            remainingCost,
            ECO_PTZ_PARAMS.nominalRate,
            ECO_PTZ_PARAMS.durationYears
        );

        profiles[profile] = {
            profile,
            workShareBeforeAid: totalCostPerUnit,
            mprCoProAmount: mprWorkAmountPerUnit,
            mprRate: totalMprRate,
            passoireBonusAmount: passoireBonusAmountPerUnit,
            fragileBonusAmount: fragileBonusAmountPerUnit,
            amoShareAmount: amoAmountPerUnitFinal,
            individualPremium,
            totalPublicSubsidies,
            ceeAmount,
            localAidAmount,
            privateLocalBoost,
            totalSubsidies,
            remainingCost,
            monthlyPayment,
        };
    }

    return {
        inputs,
        profiles,
    };
}

/**
 * Formatte un résultat de calcul pour affichage UI (helper optionnel)
 */
export function formatSubsidyForDisplay(breakdown: SubsidyBreakdown) {
    return {
        profile: breakdown.profile,
        workShare: `${Math.round(breakdown.workShareBeforeAid).toLocaleString('fr-FR')} €`,
        mprAmount: `${Math.round(breakdown.mprCoProAmount).toLocaleString('fr-FR')} €`,
        premium: `${breakdown.individualPremium.toLocaleString('fr-FR')} €`,
        remaining: `${Math.round(breakdown.remainingCost).toLocaleString('fr-FR')} €`,
        monthly: `${Math.round(breakdown.monthlyPayment).toLocaleString('fr-FR')} €/mois`,
    };
}
