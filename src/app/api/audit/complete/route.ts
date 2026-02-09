/**
 * VALO-SYNDIC — API Route: POST /api/audit/complete
 * ===================================================
 * Plan B Step 2: Complete un audit DRAFT avec des donnees manuelles.
 *
 * INPUT:
 *   POST /api/audit/complete
 *   {
 *     "auditId": "uuid",
 *     "goldenData": { ... },         // Golden datas existantes (du DRAFT)
 *     "enrichment": { ... },         // Enrichment existant
 *     "manualData": {
 *       "surfaceHabitable": 2500,    // Les champs manquants
 *       "constructionYear": 1975,
 *       "dpeCurrent": "F",
 *       "pricePerSqm": 3200,
 *       "numberOfUnits": 45
 *     },
 *     "targetDPE": "C"              // optionnel
 *   }
 *
 * OUTPUT:
 *   - 200: Updated AuditFlashInitResponse
 *   - 400: Validation error
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completeAuditFlash } from "@/lib/audit-flash";
import type { GoldenData, AuditEnrichment } from "@/lib/audit-flash";

// =============================================================================
// VALIDATION
// =============================================================================

const AuditCompleteSchema = z.object({
    auditId: z.string().uuid("auditId invalide"),
    goldenData: z.record(z.unknown()),
    enrichment: z.record(z.unknown()),
    manualData: z.object({
        surfaceHabitable: z.number().positive().optional(),
        constructionYear: z.number().int().min(1800).max(2030).optional(),
        dpeCurrent: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional(),
        pricePerSqm: z.number().positive().optional(),
        numberOfUnits: z.number().int().min(1).max(500).optional(),
    }),
    targetDPE: z
        .enum(["A", "B", "C", "D", "E", "F", "G"])
        .optional()
        .default("C"),
});

// =============================================================================
// HANDLER
// =============================================================================

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

        const result = completeAuditFlash(
            parsed.data.goldenData as unknown as GoldenData,
            parsed.data.enrichment as unknown as AuditEnrichment,
            parsed.data.manualData,
            parsed.data.targetDPE
        );

        const status = result.computation ? "COMPLETED" : result.missingFields.length > 0 ? "DRAFT" : "READY";

        return NextResponse.json(
            {
                auditId: parsed.data.auditId,
                status,
                goldenData: result.goldenData,
                enrichment: result.enrichment,
                computation: result.computation,
                missingFields: result.missingFields,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store",
                    "X-Audit-Status": status,
                },
            }
        );
    } catch (error) {
        console.error("[AUDIT FLASH COMPLETE] Erreur fatale:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Erreur interne." },
            { status: 500 }
        );
    }
}
