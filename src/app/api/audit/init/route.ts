/**
 * POST /api/audit/init
 *
 * Input:  { address: string, numberOfUnits?: number, targetDPE?: "A"-"G" }
 * Output: AuditFlashInitResponse (status: DRAFT | COMPLETED)
 *
 * Persiste dans la table audits_flash si Supabase est configure.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { initAuditFlash, toSupabaseRow } from "@/lib/audit-flash";

const AuditInitSchema = z.object({
    address: z.string().min(5, "Adresse trop courte").max(500, "Adresse trop longue"),
    numberOfUnits: z.number().int().min(1).max(500).optional(),
    targetDPE: z.enum(["A", "B", "C", "D", "E", "F", "G"]).optional().default("C"),
});

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

        const parsed = AuditInitSchema.safeParse(body);
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

        // 1. Lancer l'Audit Flash (APIs + Calcul)
        const result = await initAuditFlash({
            address: parsed.data.address,
            numberOfUnits: parsed.data.numberOfUnits,
            targetDPE: parsed.data.targetDPE,
        });

        // 2. Persister dans Supabase (best-effort, ne bloque pas la reponse)
        const supabase = getSupabase();
        if (supabase) {
            const row = toSupabaseRow(result, parsed.data.address, parsed.data.targetDPE);
            const { error: dbError } = await supabase
                .from("audits_flash")
                .insert(row);

            if (dbError) {
                console.error("[AUDIT FLASH] Erreur Supabase insert:", dbError.message);
            }
        }

        // 3. Reponse
        return NextResponse.json(result, {
            status: 200,
            headers: { "Cache-Control": "no-store", "X-Audit-Status": result.status },
        });
    } catch (error) {
        console.error("[AUDIT FLASH] Erreur fatale:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Erreur interne." },
            { status: 500 }
        );
    }
}
