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
        /** TVA Rénovation Énergétique logements > 2 ans (Art. 279-0 bis A) */
        TRAVAUX: 0.055,
        /** TVA Travaux d'amélioration standard non énergétiques (Art. 279-0 bis) */
        AMELIORATION: 0.10,
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
         * Plafond standard d'imputation du déficit foncier (CGI Art. 156-I-3°)
         * Applicable sur le revenu global — excédent reportable 10 ans sur revenus fonciers.
         */
        PLAFOND_STANDARD: 10_700,
        /**
         * Plafond dérogatoire — Loi de Finances 2026
         * Exclusivement réservé aux passoires thermiques (DPE initial F ou G).
         * Recentré par Bercy — les DPE E en sont exclus.
         */
        PLAFOND_DEROGATOIRE: 21_400,
        /**
         * Tranches Marginales d'Imposition (TMI) applicables au Déficit Foncier
         * Art. 156 CGI — Régime Réel uniquement.
         * Source : Barème de l'impôt sur le revenu 2026 (revenus 2025).
         */
        TMI_BRACKETS: [0.11, 0.30, 0.41, 0.45] as const,
    },
    /**
     * MPR Copropriété — Primes Individuelles Complémentaires (ANAH 2026)
     * Versées au syndicat mais déduites du RAC du lot concerné.
     * Source : Guide des aides financières de l'ANAH, Édition Février 2026.
     */
    MPR_PRIMES_INDIVIDUELLES: {
        /** Profil Bleu (Très Modeste) */
        BLEU: 3_000,
        /** Profil Jaune (Modeste) */
        JAUNE: 1_500,
        /** Profil Violet (Intermédiaire) et Rose (Supérieur) : pas de prime */
        VIOLET: 0,
        ROSE: 0,
    },

    /**
     * Bonus Copropriété Fragile (+20 pts MPR Copro)
     * ─────────────────────────────────────────────
     * Conditions (l'une OU l'autre) :
     *   1. Taux d'impayés de charges N-2 ≥ 8 % du budget voté
     *   2. Copropriété en quartier NPNRU
     *
     * ⚠️ CONTRAINTE CRITIQUE : active la cession exclusive des CEE à l'ANAH.
     *    → Si isCoproFragile = true, alors ceeAmount = 0 dans le waterfall.
     *
     * Source : ANAH Instruction MPR Copropriété 2023 §6,
     *          ANAH Panorama des aides 2025 p. 9
     * Note   : Constante précédemment présente dans subsidy-calculator.ts (fichier mort).
     *          Déplacée ici (financialConstants.ts) — source unique de vérité.
     */
    FRAGILE_BONUS: {
        /** Bonus de taux MPR pour copropriétés fragiles */
        RATE: 0.20,
        /** Taux maximum atteignable avec fragile + passoire (45 + 10 + 20) */
        MAX_COMBINED_RATE: 0.75,
    },

    /**
     * Prêt Avance Mutation à taux zéro (PAR+)
     * ─────────────────────────────────────────
     * Prêt hypothécaire — taux 0 % / 10 ans — remboursable in fine.
     * Scope copropriété : PARTIES PRIVATIVES UNIQUEMENT.
     * Personnes éligibles : revenus modestes ou très modestes (barèmes ANAH).
     *
     * Source : service-public.gouv.fr/F38425 (màj 01/01/2026),
     *          Décret n°2024-887 du 03/09/2024,
     *          Arrêté du 10/12/2025,
     *          Code consommation art. L315-1 à L315-23
     */
    PAR_PLUS: {
        /** Plafond absolu (rénovation globale) */
        MAX: 50_000,
        /** 1 action sur parois vitrées uniquement */
        VITREES_SEULES: 7_000,
        /** 1 geste d'une autre nature (hors vitrées) */
        GESTE_SEUL: 15_000,
        /** Bouquet de 2 postes de travaux */
        BOUQUET_2_GESTES: 25_000,
        /** Rénovation globale (performance minimale requise) */
        RENOVATION_GLOBALE: 50_000,
        /** Taux d'intérêt pendant les 10 premières années (pris en charge par l'État) */
        TAUX_10_ANS: 0,
        /** Durée de franchise (années) */
        FRANCHISE_ANS: 10,
    },

    /**
     * MaPrimeAdapt' — Volet Copropriété (Parties Communes)
     * ──────────────────────────────────────────────────────
     * Aide ANAH pour travaux d'accessibilité sur parties communes.
     * AMO obligatoire. Cumulable avec MPR Copropriété et aides LHI.
     *
     * Profils éligibles :
     *   - ≥ 70 ans (sans condition GIR)
     *   - 60–69 ans avec GIR 1-4
     *   - Taux d'incapacité ≥ 50 % (RQTH / AAH / PCH)
     *
     * Source : ANAH Panorama des aides 2025 p. 11-12,
     *          service-public.gouv.fr/F1328
     */
    MAPRIMEADAPT: {
        /** Aide parties communes copropriété (montant maximum) */
        PARTIES_COMMUNES_MAX: 10_000,
    },
} as const;

// =============================================================================
// BARÈMES DE REVENUS ANAH 2026 (MaPrimeRénov')
// =============================================================================
// Source : Guide des aides financières de l'ANAH, Édition Février 2026.
// Utilisés pour la classification des profils individuels (PersonalSimulator).

export const BAREME_ANAH_2026_PROVINCE = {
    bleu: { base: [17_363, 25_393, 30_540, 35_676, 40_835], supp: 5_151 },
    jaune: { base: [22_259, 32_553, 39_148, 45_735, 52_348], supp: 6_598 },
    violet: { base: [31_185, 45_842, 55_196, 64_550, 73_907], supp: 9_357 },
    // Catégorie "Rose" déduite : > seuil violet
} as const;

export const BAREME_ANAH_2026_IDF = {
    bleu: { base: [24_031, 35_270, 42_357, 49_455, 56_580], supp: 7_116 },
    jaune: { base: [29_253, 42_933, 51_564, 60_208, 68_877], supp: 8_663 },
    violet: { base: [40_851, 60_051, 71_846, 84_562, 96_817], supp: 12_257 },
} as const;

export type Finances2026 = typeof FINANCES_2026;
export type TmiBracket = typeof FINANCES_2026.DEFICIT_FONCIER.TMI_BRACKETS[number];
