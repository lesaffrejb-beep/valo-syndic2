/**
 * VALO-SYNDIC — API Route: POST /api/audit/init
 * ===============================================
 * Le Chasseur: transforme une adresse brute en analyse financiere.
 *
 * FLUX:
 * 1. Valide l'input (adresse obligatoire)
 * 2. Tir de Barrage: APIs en parallele (BAN, Cadastre, DVF, ADEME)
 * 3. Checkpoint de Verite: Golden Datas completes?
 *    - OUI -> Lance le moteur ValoSyndic -> COMPLETED
 *    - NON -> Renvoie DRAFT + liste des champs manquants (Plan B)
 *
 * INPUT:
 *   POST /api/audit/init
 *   {
 *     "address": "25 Rue des Lices, 49100 Angers",
 *     "numberOfUnits": 45,       // optionnel
 *     "targetDPE": "C"           // optionnel, defaut: "C"
 *   }
 *
 * OUTPUT:
 *   - 200: AuditFlashInitResponse (status: DRAFT | READY | COMPLETED)
 *   - 400: Validation error
 *   - 500: Internal error
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initAuditFlash } from "@/lib/audit-flash";

// =============================================================================
// VALIDATION (Zod — zero tolerance)
// =============================================================================

const AuditInitSchema = z.object({
    address: z
        .string()
        .min(5, "L'adresse doit contenir au moins 5 caracteres")
        .max(500, "L'adresse est trop longue"),
    numberOfUnits: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional(),
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
        // 1. Parse le body
        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json(
                {
                    error: "INVALID_JSON",
                    message: "Le body de la requete doit etre un JSON valide.",
                },
                { status: 400 }
            );
        }

        // 2. Validation stricte
        const parsed = AuditInitSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "VALIDATION_ERROR",
                    message: "Donnees d'entree invalides.",
                    details: parsed.error.issues.map((issue: z.ZodIssue) => ({
                        field: issue.path.join("."),
                        message: issue.message,
                    })),
                },
                { status: 400 }
            );
        }

        // 3. Lancer l'Audit Flash
        const result = await initAuditFlash({
            address: parsed.data.address,
            numberOfUnits: parsed.data.numberOfUnits,
            targetDPE: parsed.data.targetDPE,
        });

        // 4. Reponse structuree
        return NextResponse.json(result, {
            status: 200,
            headers: {
                "Cache-Control": "no-store",
                "X-Audit-Status": result.status,
            },
        });
    } catch (error) {
        console.error("[AUDIT FLASH] Erreur fatale:", error);
        return NextResponse.json(
            {
                error: "INTERNAL_ERROR",
                message: "Erreur interne lors de l'initialisation de l'audit.",
            },
            { status: 500 }
        );
    }
}
