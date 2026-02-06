/**
 * Service Settings - Paramètres dynamiques Supabase
 * 
 * 🎯 AUDIT CONNECTIVITÉ - Phase 2:
 * Récupère les constantes métier depuis Supabase pour permettre
 * les mises à jour sans redéploiement.
 * 
 * Stratégie: Supabase first, valeurs codées en fallback
 */

import { type DPELetter } from "@/lib/constants";

// =============================================================================
// TYPES
// =============================================================================

export interface Setting {
    key: string;
    value: unknown;
    data_type: 'string' | 'number' | 'boolean' | 'json' | 'date';
    category: string;
    description?: string | undefined;
    source?: string | undefined;
    source_url?: string | undefined;
    reference_date?: string | undefined;
    updated_at: string;
}

export interface BT01Data {
    value: number;
    display: string;
    raw_value?: number | undefined;
    raw_previous?: number | undefined;
    monthly_change?: number | undefined;
}

export interface PricingData {
    value: number;
    currency: string;
    region?: string | undefined;
    description?: string | undefined;
}

export interface RegulationData {
    value: boolean | number | string;
    display?: string | undefined;
    description?: string | undefined;
    status?: 'active' | 'upcoming' | 'future' | undefined;
}

export interface AidRateData {
    value: number;
    display: string;
    threshold?: number | undefined;
}

export interface DynamicConstants {
    // Inflation
    bt01InflationRate: number;
    constructionInflationRate: number;

    // Pricing
    basePricePerSqm: number;
    estimatedRenoCostPerSqm: number;

    // Regulation
    mprCoproActive: boolean;
    ecoPtzRate: number;
    tvaRenovationRate: number;

    // Aids
    mprMinEnergyGain: number;
    mprStandardRate: number;
    mprPerformanceRate: number;
    mprExitPassoireBonus: number;
    mprCeilingPerUnit: number;
    amoCostPerLot: number;
    amoAidRate: number;

    // Technical
    electricityConversionCoeff: number;
    greenValueAppreciation: number;
    greenValueDrift: number;

    // Project fees
    syndicRate: number;
    doRate: number;
    contingencyRate: number;

    // DPE Prohibition dates
    dpeProhibitionDates: Record<DPELetter, Date | null>;
}

// =============================================================================
// FALLBACK VALUES (Valeurs codées en dur si Supabase indisponible)
// =============================================================================

const FALLBACK_CONSTANTS: DynamicConstants = {
    // Inflation
    bt01InflationRate: 0.02,
    constructionInflationRate: 0.02,

    // Pricing
    basePricePerSqm: 3500,
    estimatedRenoCostPerSqm: 1350,

    // Regulation
    mprCoproActive: false,
    ecoPtzRate: 0,
    tvaRenovationRate: 0.055,

    // Aids
    mprMinEnergyGain: 0.35,
    mprStandardRate: 0.30,
    mprPerformanceRate: 0.45,
    mprExitPassoireBonus: 0.10,
    mprCeilingPerUnit: 25000,
    amoCostPerLot: 600,
    amoAidRate: 0.50,

    // Technical
    electricityConversionCoeff: 1.9,
    greenValueAppreciation: 0.12,
    greenValueDrift: 0.015,

    // Project fees
    syndicRate: 0.03,
    doRate: 0.02,
    contingencyRate: 0.05,

    // DPE Prohibition dates
    dpeProhibitionDates: {
        G: new Date("2025-01-01"),
        F: new Date("2028-01-01"),
        E: new Date("2034-01-01"),
        D: null,
        C: null,
        B: null,
        A: null,
    },
};

// =============================================================================
// CACHE
// =============================================================================

let settingsCache: Map<string, Setting> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extrait une valeur numérique d'un setting JSON
 */
function extractNumeric(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.value === 'number') return obj.value;
        if (typeof obj.value === 'string') {
            const parsed = parseFloat(obj.value);
            if (!isNaN(parsed)) return parsed;
        }
    }
    return null;
}

/**
 * Extrait une valeur booléenne d'un setting
 */
function extractBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.value === 'boolean') return obj.value;
    }
    return null;
}

/**
 * Extrait une date d'un setting
 */
function extractDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }
    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        if (typeof obj.value === 'string') {
            const date = new Date(obj.value);
            if (!isNaN(date.getTime())) return date;
        }
    }
    return null;
}

// =============================================================================
// SUPABASE CLIENT (Lazy load)
// =============================================================================

async function getSupabaseClient() {
    // Dynamic import to avoid issues during SSR/build
    const { createClient } = await import("@supabase/supabase-js");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase environment variables not configured");
    }

    return createClient(supabaseUrl, supabaseKey);
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Récupère tous les paramètres depuis Supabase
 * Utilise le cache si disponible et non expiré
 */
export async function fetchAllSettings(): Promise<Map<string, Setting>> {
    // Check cache
    if (settingsCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
        return settingsCache;
    }

    try {
        const supabase = await getSupabaseClient();

        const { data, error } = await supabase
            .from('global_settings')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.warn("Supabase settings fetch failed:", error);
            // Return empty map, fallback values will be used
            return new Map();
        }

        const settingsMap = new Map<string, Setting>();

        (data || []).forEach((setting: Setting) => {
            settingsMap.set(setting.key, setting);
        });

        // Update cache
        settingsCache = settingsMap;
        cacheTimestamp = Date.now();

        return settingsMap;
    } catch (error) {
        console.warn("Failed to fetch settings from Supabase:", error);
        return new Map();
    }
}

/**
 * Récupère un paramètre spécifique
 */
export async function getSetting(key: string): Promise<Setting | null> {
    const settings = await fetchAllSettings();
    return settings.get(key) || null;
}

/**
 * Récupère une valeur numérique
 */
export async function getNumericSetting(key: string, defaultValue: number): Promise<number> {
    const setting = await getSetting(key);
    if (!setting) return defaultValue;

    const value = extractNumeric(setting.value);
    return value !== null ? value : defaultValue;
}

/**
 * Récupère une valeur booléenne
 */
export async function getBooleanSetting(key: string, defaultValue: boolean): Promise<boolean> {
    const setting = await getSetting(key);
    if (!setting) return defaultValue;

    const value = extractBoolean(setting.value);
    return value !== null ? value : defaultValue;
}

/**
 * Récupère les constantes dynamiques complètes
 * Fusionne les valeurs Supabase avec les fallbacks
 */
export async function getDynamicConstants(): Promise<DynamicConstants> {
    const settings = await fetchAllSettings();

    const getNum = (key: string, fallback: number): number => {
        const setting = settings.get(key);
        if (!setting) return fallback;
        const value = extractNumeric(setting.value);
        return value !== null ? value : fallback;
    };

    const getBool = (key: string, fallback: boolean): boolean => {
        const setting = settings.get(key);
        if (!setting) return fallback;
        const value = extractBoolean(setting.value);
        return value !== null ? value : fallback;
    };

    const getDate = (key: string, fallback: Date | null): Date | null => {
        const setting = settings.get(key);
        if (!setting) return fallback;
        const value = extractDate(setting.value);
        return value !== null ? value : fallback;
    };

    return {
        // Inflation
        bt01InflationRate: getNum('bt01_inflation_rate', FALLBACK_CONSTANTS.bt01InflationRate),
        constructionInflationRate: getNum('construction_inflation_rate', FALLBACK_CONSTANTS.constructionInflationRate),

        // Pricing
        basePricePerSqm: getNum('base_price_per_sqm', FALLBACK_CONSTANTS.basePricePerSqm),
        estimatedRenoCostPerSqm: getNum('estimated_reno_cost_per_sqm', FALLBACK_CONSTANTS.estimatedRenoCostPerSqm),

        // Regulation
        mprCoproActive: getBool('mpr_copro_active', FALLBACK_CONSTANTS.mprCoproActive),
        ecoPtzRate: getNum('eco_ptz_rate', FALLBACK_CONSTANTS.ecoPtzRate),
        tvaRenovationRate: getNum('tva_renovation_rate', FALLBACK_CONSTANTS.tvaRenovationRate),

        // Aids
        mprMinEnergyGain: getNum('mpr_min_energy_gain', FALLBACK_CONSTANTS.mprMinEnergyGain),
        mprStandardRate: getNum('mpr_standard_rate', FALLBACK_CONSTANTS.mprStandardRate),
        mprPerformanceRate: getNum('mpr_performance_rate', FALLBACK_CONSTANTS.mprPerformanceRate),
        mprExitPassoireBonus: getNum('mpr_exit_passoire_bonus', FALLBACK_CONSTANTS.mprExitPassoireBonus),
        mprCeilingPerUnit: getNum('mpr_ceiling_per_unit', FALLBACK_CONSTANTS.mprCeilingPerUnit),
        amoCostPerLot: getNum('amo_cost_per_lot', FALLBACK_CONSTANTS.amoCostPerLot),
        amoAidRate: getNum('amo_aid_rate', FALLBACK_CONSTANTS.amoAidRate),

        // Technical
        electricityConversionCoeff: getNum('electricity_conversion_coeff', FALLBACK_CONSTANTS.electricityConversionCoeff),
        greenValueAppreciation: getNum('green_value_appreciation', FALLBACK_CONSTANTS.greenValueAppreciation),
        greenValueDrift: getNum('green_value_drift', FALLBACK_CONSTANTS.greenValueDrift),

        // Project fees
        syndicRate: getNum('project_syndic_rate', FALLBACK_CONSTANTS.syndicRate),
        doRate: getNum('project_do_rate', FALLBACK_CONSTANTS.doRate),
        contingencyRate: getNum('project_contingency_rate', FALLBACK_CONSTANTS.contingencyRate),

        // DPE Prohibition dates
        dpeProhibitionDates: {
            G: getDate('dpe_prohibition_g', FALLBACK_CONSTANTS.dpeProhibitionDates.G),
            F: getDate('dpe_prohibition_f', FALLBACK_CONSTANTS.dpeProhibitionDates.F),
            E: getDate('dpe_prohibition_e', FALLBACK_CONSTANTS.dpeProhibitionDates.E),
            D: FALLBACK_CONSTANTS.dpeProhibitionDates.D,
            C: FALLBACK_CONSTANTS.dpeProhibitionDates.C,
            B: FALLBACK_CONSTANTS.dpeProhibitionDates.B,
            A: FALLBACK_CONSTANTS.dpeProhibitionDates.A,
        },
    };
}

/**
 * Récupère les données BT01 formatées
 */
export async function getBT01Data(): Promise<BT01Data> {
    const setting = await getSetting('bt01_inflation_rate');

    if (!setting) {
        return {
            value: FALLBACK_CONSTANTS.bt01InflationRate,
            display: `${(FALLBACK_CONSTANTS.bt01InflationRate * 100).toFixed(1)}%`,
        };
    }

    const value = setting.value as BT01Data;
    return {
        value: value.value ?? FALLBACK_CONSTANTS.bt01InflationRate,
        display: value.display ?? `${(FALLBACK_CONSTANTS.bt01InflationRate * 100).toFixed(1)}%`,
        raw_value: value.raw_value,
        raw_previous: value.raw_previous,
        monthly_change: value.monthly_change,
    };
}

/**
 * Récupère les données de pricing
 */
export async function getPricingData(): Promise<{
    basePricePerSqm: PricingData;
    estimatedRenoCostPerSqm: PricingData;
}> {
    const [basePriceSetting, renoCostSetting] = await Promise.all([
        getSetting('base_price_per_sqm'),
        getSetting('estimated_reno_cost_per_sqm'),
    ]);

    return {
        basePricePerSqm: (basePriceSetting?.value as PricingData) || {
            value: FALLBACK_CONSTANTS.basePricePerSqm,
            currency: 'EUR',
        },
        estimatedRenoCostPerSqm: (renoCostSetting?.value as PricingData) || {
            value: FALLBACK_CONSTANTS.estimatedRenoCostPerSqm,
            currency: 'EUR',
        },
    };
}

/**
 * Invalide le cache
 */
export function invalidateSettingsCache(): void {
    settingsCache = null;
    cacheTimestamp = 0;
}

/**
 * Vérifie si Supabase est configuré
 */
export function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}

// =============================================================================
// SYNCHRONOUS FALLBACKS (pour utilisation dans des calculs synchrones)
// =============================================================================

/**
 * Retourne les constantes de fallback synchrones
 * À utiliser quand on ne peut pas attendre la réponse async
 */
export function getFallbackConstants(): DynamicConstants {
    return { ...FALLBACK_CONSTANTS };
}

/**
 * Crée une version "live" des constantes qui tente de charger depuis Supabase
 * mais retourne immédiatement les fallbacks si non disponible
 * 
 * Usage: 
 * const constants = await getLiveConstants();
 * console.log(constants.bt01InflationRate);
 */
export async function getLiveConstants(): Promise<DynamicConstants> {
    if (!isSupabaseConfigured()) {
        return getFallbackConstants();
    }

    try {
        return await getDynamicConstants();
    } catch (error) {
        console.warn("Failed to load live constants, using fallback:", error);
        return getFallbackConstants();
    }
}
