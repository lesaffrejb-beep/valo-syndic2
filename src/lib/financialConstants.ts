/**
 * VALO-SYNDIC — Financial Constants 2026
 * ======================================
 * Constantes réglementaires centralisées pour le moteur financier.
 * Mettre à jour ici à chaque Loi de Finances.
 */

export const FINANCES_2026 = {
    MPR: {
        /** Plafond légal de l'assiette par lot résidentiel (ANAH 2026) — Base HT */
        CEILING_PER_LOT: 25_000,
        /** Taux standard si gain énergétique 35-50% */
        RATE_STANDARD: 0.30,
        /** Taux haute performance si gain > 50% */
        RATE_HIGH_PERF: 0.45,
        /** Bonus "Sortie de Passoire" F/G → D ou mieux (+10%) — CGI Art. 279-0 bis A */
        BONUS_SORTIE_PASSOIRE: 0.10,
        /** Gain minimum pour éligibilité MPR */
        MIN_ENERGY_GAIN: 0.35,
        /** Seuil de haute performance (gain > 50%) */
        HIGH_PERF_THRESHOLD: 0.50,
        /**
         * Statut réglementaire 2026 : MaPrimeRénov' Copropriété techniquement suspendue
         * au 1er janvier 2026, faute de loi de finances promulguée.
         */
        STATUS_2026: "suspended" as const,
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
        /**
         * Frais de garantie forfaitaires — banques conventionnées (CEPAC, CIC, etc.)
         * Forfait fixe moyen documenté = 500€ (art. R. 312-11 Code Consommation).
         * Source : grille tarifaire banques partenaires Éco-PTZ collectif 2026.
         */
        GUARANTEE_FEE_FIXED: 500,
    },
    TVA: {
        /** TVA Rénovation Énergétique logements > 2 ans (Art. 279-0 bis) */
        TRAVAUX: 0.055,
        /** TVA Honoraires Syndic / MOE / AMO (régime normal) */
        HONORAIRES: 0.20,
        /** Taxe sur conventions d'assurance — Dommages-Ouvrage (Art. 991 CGI) */
        ASSURANCE_DO: 0.09,
    },
    DEFICIT_FONCIER: {
        /** TMI par défaut (tranche 30%) pour estimer l'économie d'impôt bailleur */
        TMI_DEFAULT: 0.30,
        /** Prélèvements sociaux (17.2%) cumulés sur revenus fonciers */
        PRELEVEMENT_SOCIAUX: 0.172,
        /** Taux effectif de déduction = TMI + PS (47.2%) — calculé sur base TMI 30% */
        TAUX_EFFECTIF: 0.472,
        /**
         * Tranches Marginales d'Imposition (TMI) applicables au Déficit Foncier
         * Art. 156 CGI — Régime Réel uniquement.
         * Source : Barème de l'impôt sur le revenu 2026 (revenus 2025).
         */
        TMI_BRACKETS: [0.11, 0.30, 0.41, 0.45] as const,
    },
} as const;

export type Finances2026 = typeof FINANCES_2026;
export type TmiBracket = typeof FINANCES_2026.DEFICIT_FONCIER.TMI_BRACKETS[number];
