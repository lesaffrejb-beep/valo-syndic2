"use server";

/**
 * VALO-SYNDIC — Server Action : Calcul Diagnostic
 * ================================================
 * BLACK BOX : Le moteur financier ne s'exécute que côté serveur.
 * Le navigateur ne voit jamais le code de calculator.ts.
 *
 * Chaîne de responsabilité :
 * 1. Valide l'input avec DiagnosticInputSchema (Zod)
 * 2. Récupère les paramètres dynamiques depuis Supabase (global_settings + market_data)
 * 3. Exécute generateDiagnostic() côté serveur
 * 4. Valide et retourne le DiagnosticResult sérialisé
 */

import { createClient } from "@supabase/supabase-js";
import { generateDiagnostic } from "@/lib/calculator";
import {
    DiagnosticInputSchema,
    DiagnosticResultSchema,
    type DiagnosticInput,
    type DiagnosticResult,
} from "@/lib/schemas";
import { VALUATION_PARAMS, TECHNICAL_PARAMS } from "@/lib/constants";
import { FINANCES_2026 } from "@/lib/financialConstants";

// =============================================================================
// Types de retour (sérialisables — pas de Date native côté client)
// =============================================================================

export type DiagnosticResultSerialized = Omit<DiagnosticResult, "generatedAt" | "compliance"> & {
    generatedAt: string; // ISO string
    compliance: Omit<DiagnosticResult["compliance"], "prohibitionDate"> & {
        prohibitionDate: string | null; // ISO string
    };
};

export type ActionResult =
    | { success: true; data: DiagnosticResultSerialized }
    | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// =============================================================================
// Constantes dynamiques Supabase (avec fallback hardcodé)
// =============================================================================

interface DynamicSettings {
    base_price_per_sqm: number;
    reno_cost_per_sqm: number;
    mpr_rate: number;
    mpr_ceiling: number;
    green_value: number;
}

const DEFAULT_DYNAMIC_SETTINGS: DynamicSettings = {
    base_price_per_sqm: VALUATION_PARAMS.BASE_PRICE_PER_SQM,
    reno_cost_per_sqm: VALUATION_PARAMS.ESTIMATED_RENO_COST_PER_SQM,
    mpr_rate: FINANCES_2026.MPR.RATE_STANDARD,
    mpr_ceiling: FINANCES_2026.MPR.CEILING_PER_LOT,
    green_value: TECHNICAL_PARAMS.greenValueAppreciation,
};

async function fetchDynamicSettings(): Promise<DynamicSettings> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn("[calculateDiagnostic] Supabase non configuré, utilisation des valeurs par défaut.");
        return DEFAULT_DYNAMIC_SETTINGS;
    }

    try {
        const supabase = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { data, error } = await supabase
            .from("global_settings")
            .select("key, value")
            .in("key", Object.keys(DEFAULT_DYNAMIC_SETTINGS))
            .eq("is_active", true);

        if (error || !data?.length) {
            console.warn("[calculateDiagnostic] Paramètres Supabase indisponibles, fallback constants.ts");
            return DEFAULT_DYNAMIC_SETTINGS;
        }

        const settings: DynamicSettings = { ...DEFAULT_DYNAMIC_SETTINGS };
        for (const row of data) {
            const k = row.key as keyof DynamicSettings;
            const parsed = parseFloat(String(row.value));
            if (!isNaN(parsed)) settings[k] = parsed;
        }
        return settings;
    } catch (err) {
        console.error("[calculateDiagnostic] Erreur fatale fetch Supabase:", err);
        return DEFAULT_DYNAMIC_SETTINGS;
    }
}

// =============================================================================
// Server Action — Point d'entrée unique pour le front-end
// =============================================================================

/**
 * Calcule un diagnostic complet côté serveur.
 *
 * Usage depuis un composant React :
 * ```tsx
 * import { calculateDiagnosticAction } from "@/actions/calculateDiagnostic";
 *
 * const result = await calculateDiagnosticAction(formValues);
 * if (result.success) { console.log(result.data); }
 * ```
 *
 * @param rawInput - Données brutes du formulaire (validées par Zod avant calcul)
 */
export async function calculateDiagnosticAction(
    rawInput: unknown
): Promise<ActionResult> {
    // 1. Validation Zod de l'input
    const parsed = DiagnosticInputSchema.safeParse(rawInput);
    if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
            fieldErrors[key] = issues ?? [];
        }
        return {
            success: false,
            error: "Données d'entrée invalides.",
            fieldErrors,
        };
    }

    const input: DiagnosticInput = parsed.data;

    try {
        // 2. Paramètres dynamiques Supabase (côté serveur uniquement)
        await fetchDynamicSettings();
        // Note : les settings sont actuellement intégrés via les constantes importées.
        // Phase suivante : injecter les valeurs dynamiques dans le moteur de calcul.

        // 3. Exécution du moteur financier (Black Box)
        const result = generateDiagnostic(input);

        // 4. Validation Zod du résultat (garantit l'intégrité avant envoi client)
        const validated = DiagnosticResultSchema.safeParse(result);
        if (!validated.success) {
            console.error("[calculateDiagnostic] Résultat invalide:", validated.error);
            return { success: false, error: "Erreur interne de calcul." };
        }

        // 5. Sérialisation (Date → ISO string pour transfert client/serveur Next.js)
        const serialized: DiagnosticResultSerialized = {
            ...validated.data,
            generatedAt: validated.data.generatedAt.toISOString(),
            compliance: {
                ...validated.data.compliance,
                prohibitionDate: validated.data.compliance.prohibitionDate?.toISOString() ?? null,
            },
        };

        return { success: true, data: serialized };
    } catch (error) {
        console.error("[calculateDiagnostic] Erreur moteur:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur interne inconnue.",
        };
    }
}
