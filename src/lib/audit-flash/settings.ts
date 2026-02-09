/**
 * VALO-SYNDIC — Global Settings Service
 * ======================================
 * Récupère les paramètres globaux depuis Supabase (table global_settings).
 * Fournit des fallbacks si Supabase est indisponible.
 */

import { createClient } from "@supabase/supabase-js";

export interface GlobalSettings {
    reno_cost_per_sqm: number;      // Coût travaux au m² (défaut: 180€)
    mpr_rate: number;                // Taux MPR (défaut: 0.40 = 40%)
    mpr_ceiling: number;             // Plafond MPR par lot (défaut: 25000€)
    cee_rate: number;                // Taux CEE (défaut: 0.10 = 10%)
    green_value: number;             // Plus-value verte (défaut: 0.08 = 8%)
    base_price_per_sqm: number;      // Prix m² fallback DVF (défaut: 3500€)
}

const DEFAULT_SETTINGS: GlobalSettings = {
    reno_cost_per_sqm: 180,
    mpr_rate: 0.40,
    mpr_ceiling: 25000,
    cee_rate: 0.10,
    green_value: 0.08,
    base_price_per_sqm: 3500,
};

let cachedSettings: GlobalSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Récupère les paramètres globaux depuis Supabase.
 * Utilise un cache de 5 minutes pour éviter les requêtes répétées.
 * Retourne les valeurs par défaut si Supabase est indisponible.
 */
export async function getGlobalSettings(): Promise<GlobalSettings> {
    // Cache hit
    const now = Date.now();
    if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedSettings;
    }

    const supabase = getSupabase();
    if (!supabase) {
        console.warn("[SETTINGS] Supabase non configuré, utilisation des valeurs par défaut.");
        return DEFAULT_SETTINGS;
    }

    try {
        const { data, error } = await supabase
            .from("global_settings")
            .select("key, value")
            .in("key", [
                "reno_cost_per_sqm",
                "mpr_rate",
                "mpr_ceiling",
                "cee_rate",
                "green_value",
                "base_price_per_sqm",
            ]);

        if (error) {
            console.error("[SETTINGS] Erreur Supabase:", error.message);
            return DEFAULT_SETTINGS;
        }

        if (!data || data.length === 0) {
            console.warn("[SETTINGS] Aucun paramètre trouvé dans global_settings, utilisation des valeurs par défaut.");
            return DEFAULT_SETTINGS;
        }

        // Construire l'objet settings depuis les rows
        const settings: GlobalSettings = { ...DEFAULT_SETTINGS };
        for (const row of data) {
            const key = row.key as keyof GlobalSettings;
            const value = parseFloat(row.value);
            if (!isNaN(value)) {
                settings[key] = value;
            }
        }

        // Mettre en cache
        cachedSettings = settings;
        cacheTimestamp = now;

        return settings;
    } catch (err) {
        console.error("[SETTINGS] Erreur fatale lors de la récupération des paramètres:", err);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Invalide le cache (utile pour les tests ou après une mise à jour des settings).
 */
export function invalidateSettingsCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
}
