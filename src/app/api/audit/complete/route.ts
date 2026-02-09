/**
 * POST /api/audit/complete
 *
 * Plan B Step 2 : l'utilisateur fournit les donnees manquantes.
 * Lit l'audit DRAFT depuis Supabase, fusionne, recalcule, met a jour.
 *
 * Input:
 *   {
 *     "auditId": "uuid",
 *     "manualData": { surfaceHabitable?, constructionYear?, dpeCurrent?, pricePerSqm?, numberOfUnits? },
 *     "targetDPE": "C"
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { completeAuditFlash } from "@/lib/audit-flash";
import type { GoldenData, AuditEnrichment, AuditFlashRow } from "@/lib/audit-flash";

const AuditCompleteSchema = z.object({
    auditId: z.string().uuid("auditId invalide"),
    manualData: z.object({
        surfaceHabitable: z.number().positive().optional(),
        constructionYear: z.number().int().min(1800).max(2030).optional(),
        dpeCurrent: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional(),
        pricePerSqm: z.number().positive().optional(),
        numberOfUnits: z.number().int().min(1).max(500).optional(),
    }),
    targetDPE: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional().default("C"),
});

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Reconstruit les GoldenData depuis une row Supabase */
function rowToGoldenData(row: AuditFlashRow): GoldenData {
    return {
        surfaceHabitable: {
            value: row.surface_habitable,
            origin: row.surface_origin,
            source: row.surface_source,
            confidence: row.surface_confidence,
        },
        constructionYear: {
            value: row.construction_year,
            origin: row.construction_year_origin,
            source: row.construction_year_source,
            confidence: row.construction_year_confidence,
        },
        dpe: {
            value: (row.dpe_current as GoldenData["dpe"]["value"]) ?? null,
            origin: row.dpe_origin,
            source: row.dpe_source,
            confidence: null,
            ...(row.dpe_numero != null && { numeroDpe: row.dpe_numero }),
            ...(row.dpe_date != null && { dateEtablissement: row.dpe_date }),
            ...(row.dpe_conso != null && { consommation: row.dpe_conso }),
            ...(row.dpe_ges != null && { ges: row.dpe_ges }),
        },
        pricePerSqm: {
            value: row.price_per_sqm,
            origin: row.price_origin,
            source: row.price_source,
            confidence: null,
            ...(row.price_transaction_count != null && { transactionCount: row.price_transaction_count }),
            ...(row.price_date_range != null && { dateRange: row.price_date_range }),
        },
    };
}

function rowToEnrichment(row: AuditFlashRow): AuditEnrichment {
    return {
        cadastreParcelId: row.cadastre_parcel_id,
        cadastreSurfaceTerrain: row.cadastre_surface_terrain,
        numberOfUnits: row.number_of_units,
        heatingSystem: row.heating_system,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json(
                { error: "INVALID_JSON", message: "Le body doit etre un JSON valide." },
                { status: 400 }
            );
        }

        const parsed = AuditCompleteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "VALIDATION_ERROR",
                    message: "Donnees invalides.",
                    details: parsed.error.issues.map((issue: z.ZodIssue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            );
        }

        // 1. Lire l'audit existant depuis Supabase
        const supabase = getSupabase();
        let existingGoldenData: GoldenData | null = null;
        let existingEnrichment: AuditEnrichment | null = null;

        if (supabase) {
            const { data: row, error: readError } = await supabase
                .from("audits_flash")
                .select("*")
                .eq("id", parsed.data.auditId)
                .single();

            if (readError || !row) {
                return NextResponse.json(
                    { error: "NOT_FOUND", message: `Audit ${parsed.data.auditId} introuvable.` },
                    { status: 404 }
                );
            }

            existingGoldenData = rowToGoldenData(row as AuditFlashRow);
            existingEnrichment = rowToEnrichment(row as AuditFlashRow);
        }

        if (!existingGoldenData || !existingEnrichment) {
            return NextResponse.json(
                { error: "NO_SUPABASE", message: "Supabase non configure. Impossible de recuperer l'audit." },
                { status: 503 }
            );
        }

        // 2. Fusionner et recalculer
        const result = await completeAuditFlash(
            existingGoldenData,
            existingEnrichment,
            {
                surfaceHabitable: parsed.data.manualData.surfaceHabitable,
                constructionYear: parsed.data.manualData.constructionYear,
                dpeCurrent: parsed.data.manualData.dpeCurrent,
                pricePerSqm: parsed.data.manualData.pricePerSqm,
                numberOfUnits: parsed.data.manualData.numberOfUnits
            },
            parsed.data.targetDPE
        );

        const status = result.computation ? "COMPLETED" : result.missingFields.length > 0 ? "DRAFT" : "READY";

        // 3. Mettre a jour dans Supabase
        if (supabase) {
            const gd = result.goldenData;
            const { error: updateError } = await supabase
                .from("audits_flash")
                .update({
                    status,
                    missing_fields: result.missingFields.map((f) => f.field),
                    surface_habitable: gd.surfaceHabitable.value,
                    surface_origin: gd.surfaceHabitable.origin,
                    surface_source: gd.surfaceHabitable.source,
                    surface_confidence: gd.surfaceHabitable.confidence,
                    construction_year: gd.constructionYear.value,
                    construction_year_origin: gd.constructionYear.origin,
                    construction_year_source: gd.constructionYear.source,
                    construction_year_confidence: gd.constructionYear.confidence,
                    dpe_current: gd.dpe.value,
                    dpe_origin: gd.dpe.origin,
                    dpe_source: gd.dpe.source,
                    price_per_sqm: gd.pricePerSqm.value,
                    price_origin: gd.pricePerSqm.origin,
                    price_source: gd.pricePerSqm.source,
                    number_of_units: result.enrichment.numberOfUnits,
                    computation: result.computation,
                    completed_at: status === "COMPLETED" ? new Date().toISOString() : null,
                })
                .eq("id", parsed.data.auditId);

            if (updateError) {
                console.error("[AUDIT COMPLETE] Erreur Supabase update:", updateError.message);
            }
        }

        return NextResponse.json(
            {
                auditId: parsed.data.auditId,
                status,
                goldenData: result.goldenData,
                enrichment: result.enrichment,
                computation: result.computation,
                missingFields: result.missingFields,
            },
            { status: 200, headers: { "Cache-Control": "no-store", "X-Audit-Status": status } }
        );
    } catch (error) {
        console.error("[AUDIT COMPLETE] Erreur fatale:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Erreur interne." },
            { status: 500 }
        );
    }
}
