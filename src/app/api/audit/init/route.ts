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

        // 3. Transformer la réponse pour le frontend
        // DRAFT -> MANUAL_REQ (frontend attend ce statut pour afficher le formulaire)
        // COMPLETED -> COMPLETED (données complètes, affichage des résultats)
        if (result.status === "DRAFT") {
            // Cas DRAFT: données manquantes, on retourne aussi les données TROUVÉES pour pré-remplir
            const { goldenData, enrichment } = result;

            // Construire l'objet prefillData avec toutes les données trouvées
            const prefillData = {
                // Adresse normalisée
                address: result.normalizedAddress || parsed.data.address,
                postalCode: result.postalCode || "",
                city: result.city || "",
                cityCode: result.cityCode || "",
                coordinates: result.coordinates || null,

                // Golden Data trouvées
                currentDPE: goldenData.dpe.value || null,
                surfaceHabitable: goldenData.surfaceHabitable.value || null,
                constructionYear: goldenData.constructionYear.value || null,
                pricePerSqm: goldenData.pricePerSqm.value || null,

                // Enrichissement
                numberOfUnits: enrichment.numberOfUnits || null,
                heatingSystem: enrichment.heatingSystem || null,

                // Méta: sources pour indication visuelle
                sources: result.sources.map(s => s.name),

                // DPE détails si trouvé
                dpeDetails: goldenData.dpe.value ? {
                    numeroDpe: goldenData.dpe.numeroDpe || null,
                    dateEtablissement: goldenData.dpe.dateEtablissement || null,
                    consommation: goldenData.dpe.consommation || null,
                    ges: goldenData.dpe.ges || null,
                } : null,
            };

            return NextResponse.json({
                status: "MANUAL_REQ",
                missingFields: result.missingFields.map(f => f.field),
                tempId: result.auditId,
                prefillData, // <-- NOUVEAU: données pré-remplies
            }, {
                status: 200,
                headers: { "Cache-Control": "no-store" },
            });
        } else if (result.status === "COMPLETED") {
            // Cas COMPLETED: transformer en format AuditFlashResult pour le frontend
            const { computation, goldenData, enrichment } = result;

            if (!computation) {
                // Pas de computation malgré status COMPLETED? Fallback DRAFT
                return NextResponse.json({
                    status: "MANUAL_REQ",
                    missingFields: result.missingFields.map(f => f.field),
                    tempId: result.auditId,
                }, {
                    status: 200,
                    headers: { "Cache-Control": "no-store" },
                });
            }

            const auditFlashResult = {
                audit_id: result.auditId,
                created_at: result.createdAt,
                address: result.normalizedAddress || parsed.data.address,
                city: result.city || "",
                postal_code: result.postalCode || "",
                number_of_units: enrichment.numberOfUnits || 1,
                surface_habitable: goldenData.surfaceHabitable.value || 0,
                current_dpe: goldenData.dpe.value || "F",
                target_dpe: parsed.data.targetDPE,

                // Financement
                renovation_cost: computation.simulation.worksCostTTC,
                works_cost_ht: computation.simulation.worksCostHT,
                subventions_mpr: computation.simulation.mprAmount,
                cee_amount: computation.simulation.ceeAmount,
                eco_ptz_amount: computation.simulation.ecoPtzAmount,

                // Valorisation
                valuation_current: computation.valuation.currentValue,
                valuation_projected: computation.valuation.projectedValue,

                // Énergie (estimation basée sur le saut de DPE)
                energy_gain_percent: computation.valuation.greenValuePercent || 0,
            };

            return NextResponse.json({
                status: "COMPLETED",
                result: auditFlashResult,
            }, {
                status: 200,
                headers: { "Cache-Control": "no-store" },
            });
        } else {
            // Statut inconnu, traiter comme une erreur
            return NextResponse.json({
                status: "ERROR",
                message: "Statut d'audit inconnu",
            }, {
                status: 200,
                headers: { "Cache-Control": "no-store" },
            });
        }
    } catch (error) {
        console.error("[AUDIT FLASH] Erreur fatale:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Erreur interne." },
            { status: 500 }
        );
    }
}
