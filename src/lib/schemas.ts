/**
 * VALO-SYNDIC — Schémas de Validation Zod
 * =======================================
 * Validation stricte des entrées utilisateur et des données métier.
 */

import { z } from "zod";
import { DPE_ORDER, type DPELetter } from "./constants";

// =============================================================================
// 1. ENTRÉES UTILISATEUR
// =============================================================================

/** Schéma pour une lettre DPE valide */
export const DPELetterSchema = z.enum(["A", "B", "C", "D", "E", "F", "G"]);

/** Schéma pour les données d'entrée du diagnostic */
export const DiagnosticInputSchema = z.object({
    /** Adresse normalisée (optionnel pour MVP) */
    address: z.string().min(5, "Adresse trop courte").optional(),

    /** Code postal (5 chiffres) */
    postalCode: z
        .string()
        .regex(/^\d{5}$/, "Code postal invalide (5 chiffres)")
        .optional(),

    /** Ville */
    city: z.string().min(2, "Ville trop courte").optional(),

    /** Coordonnées GPS (optionnel, pour Street View et Géorisques) */
    coordinates: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }).optional(),

    /** Classe DPE actuelle */
    currentDPE: DPELetterSchema,

    /** Classe DPE cible après travaux */
    targetDPE: DPELetterSchema,

    /** Nombre de lots (logements) dans la copropriété */
    numberOfUnits: z
        .number()
        .int()
        .min(2, "Minimum 2 lots pour une copropriété")
        .max(500, "Maximum 500 lots"),

    /** Nombre de lots commerciaux (non éligibles MPR) */
    commercialLots: z
        .number()
        .int()
        .min(0, "Ne peut pas être négatif")
        .optional()
        .default(0),

    /** Coût estimé des travaux HT (€) */
    estimatedCostHT: z
        .number()
        .min(0, "Le coût ne peut pas être négatif")
        .max(50_000_000, "Coût maximum 50 M€")
        .default(0),

    /** Système de chauffage actuel */
    heatingSystem: z.enum(['electrique', 'gaz', 'fioul', 'bois', 'urbain', 'autre']).optional(),

    /** Prix moyen au m² dans le quartier (optionnel) */
    averagePricePerSqm: z.number().positive().optional(),

    /** Source du prix au m² (ex: "DVF", "Manuel", "Estimé") */
    priceSource: z.string().optional(),

    /** Nombre de ventes utilisées pour la moyenne (si DVF) */
    salesCount: z.number().int().optional(),

    /** Surface moyenne d'un lot (m²) - optionnel */
    averageUnitSurface: z.number().positive().optional(),

    /** Montant des aides locales (Angers/Nantes) */
    localAidAmount: z.number().min(0).optional().default(0),

    /** Fonds Travaux ALUR disponible (€) - Trésorerie Dormante */
    alurFund: z.number().min(0).optional().default(0),

    /** Primes CEE estimées (€) - Certificats d'Économie d'Énergie */
    ceeBonus: z.number().min(0).optional().default(0),

    /** Facture énergétique annuelle globale (€) */
    currentEnergyBill: z.number().min(0).optional().default(0),

    /** Pourcentage de bailleurs investisseurs (0-100%) - Variable Sociologique */
    investorRatio: z.number().min(0).max(100).optional().default(0),
});

export type DiagnosticInput = z.infer<typeof DiagnosticInputSchema>;

// =============================================================================
// 1.B SIMULATION FORM (SMART FALLBACK)
// =============================================================================

const zNumberPreprocess = (schema: z.ZodNumber) =>
    z.preprocess((value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }, schema);

export const SimulationFormSchema = z.object({
    numberOfLots: zNumberPreprocess(z.number().int().min(1, "Nombre de lots requis")),
    totalLivingArea: zNumberPreprocess(z.number().min(10, "Surface requise (min 10m²)")),
    currentDpeLabel: DPELetterSchema.default("F"),
    targetDpeLabel: DPELetterSchema.default("C"),
    pricePerSqm: zNumberPreprocess(z.number().min(1, "Requis")),
    workBudget: zNumberPreprocess(z.number().min(1000, "Budget travaux requis (min 1000€)")),
});

export type SimulationFormValues = z.infer<typeof SimulationFormSchema>;

// =============================================================================
// 2. SORTIES CALCULATEUR
// =============================================================================

/** Statut de conformité réglementaire */
export const ComplianceStatusSchema = z.object({
    isProhibited: z.boolean(),
    prohibitionDate: z.date().nullable(),
    daysUntilProhibition: z.number().nullable(),
    statusLabel: z.string(),
    statusColor: z.enum(["danger", "warning", "success"]),
    urgencyLevel: z.enum(["critical", "high", "medium", "low"]),
});

export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;

/** Plan de financement détaillé */
export const FinancingPlanSchema = z.object({
    /** Coût travaux HT (base) */
    worksCostHT: z.number(),

    /** Coût total HT (Travaux + Honoraires + Aléas) */
    totalCostHT: z.number(),

    /** Coût total TTC (TVA 5.5%) */
    totalCostTTC: z.number(),

    /** Honoraires Syndic (3%) */
    syndicFees: z.number(),

    /** Assurance DO (2%) */
    doFees: z.number(),

    /** Aléas (3%) */
    contingencyFees: z.number(),

    /** Coût par lot */
    costPerUnit: z.number(),

    /** Gain énergétique estimé (%) */
    energyGainPercent: z.number(),

    /** Montant MaPrimeRénov' */
    mprAmount: z.number(),

    /** Montant Aide AMO */
    amoAmount: z.number(),

    /** Montant Aides Locales */
    localAidAmount: z.number(),

    /** Taux MPR appliqué */
    mprRate: z.number(),

    /** Bonus sortie passoire applicable */
    exitPassoireBonus: z.number(),

    /** Montant Éco-PTZ disponible */
    ecoPtzAmount: z.number(),

    /** Certificats d'Économie d'Énergie (CEE) */
    ceeAmount: z.number(),

    /** Reste à charge après aides */
    remainingCost: z.number(),

    /** Mensualité Éco-PTZ (sur 20 ans) */
    monthlyPayment: z.number(),

    /** Économies mensuelles estimées sur facture énergétique */
    monthlyEnergySavings: z.number().default(0),

    /** Flux net mensuel (économie - mensualité) */
    netMonthlyCashFlow: z.number().default(0),

    /** Reste à charge par lot */
    remainingCostPerUnit: z.number(),
});

export type FinancingPlan = z.infer<typeof FinancingPlanSchema>;

/** Coût de l'inaction */
export const InactionCostSchema = z.object({
    /** Coût actuel */
    currentCost: z.number(),

    /** Coût projeté à +3 ans avec inflation */
    projectedCost3Years: z.number(),

    /** Perte de valeur vénale estimée */
    valueDepreciation: z.number(),

    /** Coût total de l'inaction */
    totalInactionCost: z.number(),
});

export type InactionCost = z.infer<typeof InactionCostSchema>;

/** Valorisation Patrimoniale (DVF) **/
export const ValuationResultSchema = z.object({
    /** Valeur estimée actuelle (€) */
    currentValue: z.number(),

    /** Valeur estimée après travaux (€) */
    projectedValue: z.number(),

    /** Tendance marché appliquée (optionnel) - AUDIT 31/01/2026 */
    marketTrendApplied: z.number().optional(),

    /** Plus-value "Valeur Verte" (€) */
    greenValueGain: z.number(),

    /** Plus-value en pourcentage */
    greenValueGainPercent: z.number(),

    /** Retour sur investissement net (Plus-value - Reste à charge) */
    netROI: z.number(),

    /** Prix au m2 utilisé pour l'estimation */
    pricePerSqm: z.number(),

    /** Source du prix (pour affichage UI) */
    priceSource: z.string().optional(),

    /** Nombre de ventes (pour crédibilité) */
    salesCount: z.number().optional(),

    /** Détection automatique chaudière fossile (pour alertes) */
    isFossilFuel: z.boolean().optional(),
});

export type ValuationResult = z.infer<typeof ValuationResultSchema>;

/** Résultat complet du diagnostic */
export const DiagnosticResultSchema = z.object({
    input: DiagnosticInputSchema,
    compliance: ComplianceStatusSchema,
    financing: FinancingPlanSchema,
    inactionCost: InactionCostSchema,
    valuation: ValuationResultSchema,
    generatedAt: z.date(),
});

export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

// =============================================================================
// 3. VALIDATEURS MÉTIER
// =============================================================================

/**
 * Valide que le DPE cible est meilleur que le DPE actuel
 */
export function validateDPEProgression(
    current: DPELetter,
    target: DPELetter
): boolean {
    const currentIndex = DPE_ORDER.indexOf(current);
    const targetIndex = DPE_ORDER.indexOf(target);
    // Index plus élevé = meilleur DPE (G=0, A=6)
    return targetIndex > currentIndex;
}

/**
 * Calcule le gain énergétique estimé entre deux classes DPE
 * Simplification : chaque saut de classe = ~15-20% de gain
 */
export function estimateEnergyGain(
    current: DPELetter,
    target: DPELetter
): number {
    const currentIndex = DPE_ORDER.indexOf(current);
    const targetIndex = DPE_ORDER.indexOf(target);
    const steps = targetIndex - currentIndex;

    if (steps <= 0) return 0;
    if (steps === 1) return 0.15; // 15% pour 1 classe (ex: E->D)
    if (steps === 2) return 0.40; // 40% pour 2 classes (ex: E->C)
    if (steps >= 3) return 0.55;  // 55% pour 3 classes ou + (ex: F->C)

    return Math.min(steps * 0.15, 0.70);
}

// =============================================================================
// 4. SCHÉMA DE SAUVEGARDE (VERSIONNÉ)
// =============================================================================

export const ValoSaveSchema = z.object({
    version: z.literal("1.0"),
    savedAt: z.string().datetime().optional(), // ISO string
    metadata: z.object({
        appName: z.literal("VALO-SYNDIC").optional(),
        createdAt: z.coerce.date().optional(),
    }).optional(),
    input: DiagnosticInputSchema,
    result: DiagnosticResultSchema.optional(), // On peut sauvegarder juste l'input ou le résultat complet
});

export type ValoSaveData = z.infer<typeof ValoSaveSchema>;

// =============================================================================
// 5. SCHÉMA D'IMPORT EXTENSION (VALO-SYNDIC GHOST)
// =============================================================================

/** Schéma pour un lot importé depuis l'extension */
export const ImportedLotSchema = z.object({
    id: z.string().min(1, "ID requis"),
    tantiemes: z.preprocess((val) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val, z.number().int().min(1, "Tantièmes minimum 1")),
    surface: z.preprocess((val) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val, z.number().positive("Surface doit être positive").optional()),
    type: z.string().optional(),
});

/** Schéma pour le JSON complet de l'extension */
export const GhostExtensionImportSchema = z.object({
    source: z.literal("valo-syndic-ghost"),
    version: z.string(),
    extractedAt: z.string().datetime(),
    url: z.string().url().optional(),
    lots: z.array(ImportedLotSchema).min(1, "Au moins 1 lot requis"),
});

export type ImportedLot = z.infer<typeof ImportedLotSchema>;
export type GhostExtensionImport = z.infer<typeof GhostExtensionImportSchema>;

// =============================================================================
// 6. AUTHENTICATION & PROJECT MANAGEMENT
// =============================================================================

/** Saved Simulation Schema (from Supabase) */
export const SavedSimulationSchema = z.object({
    id: z.string().uuid(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
    project_name: z.string().nullable(),
    city: z.string().nullable(),
    postal_code: z.string().nullable(),
    json_data: z.any(), // DiagnosticResult as JSONB
    user_email: z.string().email().nullable(),
    user_id: z.string().uuid().nullable(),
    status: z.enum(['draft', 'shared', 'archived']).default('draft'),
});

export type SavedSimulation = z.infer<typeof SavedSimulationSchema>;

/** Market Stats Schema (Hive Mind - Anonymous) */
export const MarketStatsSchema = z.object({
    postal_code: z.string().optional(),
    city: z.string().optional(),
    current_dpe: DPELetterSchema,
    target_dpe: DPELetterSchema,
    cost_per_sqm: z.number().optional(),
    number_of_units: z.number().int(),
    work_cost_ht: z.number().optional(),
    subsidy_rate: z.number().optional(),
});

export type MarketStats = z.infer<typeof MarketStatsSchema>;
