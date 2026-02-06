/**
 * VALO-SYNDIC — Financial Constants 2026
 * ======================================
 * Constantes réglementaires centralisées pour le moteur financier.
 * Mettre à jour ici à chaque Loi de Finances.
 */

export const FINANCES_2026 = {
    MPR: {
        /** Plafond légal de l'assiette par logement (ANAH 2026) */
        CEILING_PER_LOT: 25_000,
        /** Taux standard si gain énergétique 35-50% */
        RATE_STANDARD: 0.30,
        /** Taux haute performance si gain > 50% */
        RATE_HIGH_PERF: 0.45,
        /** Gain minimum pour éligibilité MPR */
        MIN_ENERGY_GAIN: 0.35,
        /** Seuil de haute performance (gain > 50%) */
        HIGH_PERF_THRESHOLD: 0.50,
    },
    CEE: {
        /** Estimation conservatrice des CEE (8% des travaux HT) */
        AVG_RATE_WORKS: 0.08,
        /** Plafond réglementaire par lot (rénovation globale) */
        MAX_PER_LOT: 5_000,
    },
    LOAN: {
        /** Plafond Éco-PTZ par lot (rénovation globale) */
        ECO_PTZ_MAX_PER_LOT: 50_000,
        /** Plafond Éco-PTZ par lot (conservateur par défaut) */
        ECO_PTZ_MAX_PER_LOT_STANDARD: 30_000,
        /** Durée standard Éco-PTZ (20 ans) */
        ECO_PTZ_DURATION_MONTHS: 240,
        /** Taux Éco-PTZ (0% = prêt sans intérêts) */
        RATE_ECO_PTZ: 0,
    },
} as const;

export type Finances2026 = typeof FINANCES_2026;
