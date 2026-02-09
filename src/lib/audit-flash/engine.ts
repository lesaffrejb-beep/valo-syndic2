/**
 * VALO-SYNDIC — Audit Flash Engine
 * =================================
 * Le Chasseur: orchestre la chasse aux donnees et le moteur de calcul.
 *
 * DOCTRINE:
 * 1. Tir de Barrage: Interroge en parallele BAN, Cadastre, DVF, ADEME, RNIC
 * 2. Checkpoint de Verite: SI Golden Data manquante -> DRAFT + Plan B
 * 3. Si tout est plein -> READY -> Lance le moteur ValoSyndic
 *
 * ENDPOINTS API GRATUITS UTILISES:
 * ---------------------------------------------------------------
 * | API                | URL                                      | Cle? |
 * |--------------------|------------------------------------------|------|
 * | BAN (Adresse)      | https://api-adresse.data.gouv.fr         | Non  |
 * | Cadastre (IGN)     | https://apicarto.ign.fr/api/cadastre     | Non  |
 * | DVF (Etalab)       | https://api.dvf.etalab.gouv.fr           | Non  |
 * | ADEME DPE          | https://data.ademe.fr/data-fair/api/v1   | Non  |
 * | RNIC (Copro)       | Table Supabase (import CSV data.gouv.fr) | Non  |
 * ---------------------------------------------------------------
 */

import { normalizeAddress, extractAddressData } from "@/lib/api/addressService";
import { searchCadastreByCoordinates } from "@/lib/api/cadastreService";
import { searchDVFWithFallback, calculateDVFStats } from "@/lib/api/dvfService";
import { searchDPEByAddress, searchDPEByLocation } from "@/lib/api/ademeDpeService";
import type { AdemeDPEEntry } from "@/lib/api/ademeDpeService";
import type { EnrichmentSource } from "@/lib/api/types";
import type { DPELetter } from "@/lib/constants";
import { VALUATION_PARAMS } from "@/lib/constants";
import {
    generateDiagnostic,
    estimateDPEByYear,
} from "@/lib/calculator";
import type { DiagnosticInput } from "@/lib/schemas";

import type {
    AuditFlashStatus,
    AuditFlashInitRequest,
    AuditFlashInitResponse,
    GoldenData,
    MissingField,
    AuditComputation,
    AuditEnrichment,
    APIHuntResult,
    HuntResults,
    SourcedData,
} from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Timeout par API en ms (10 secondes — antifragile) */
const API_TIMEOUT_MS = 10_000;

/** Cout moyen renovation au m2 (ITE + VMC, ratio 180EUR/m2 hab) */
const RENO_COST_PER_SQM = 180;

// =============================================================================
// HELPERS
// =============================================================================

/** Wrap une promesse avec un timeout — le systeme ne bloque jamais */
async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string
): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout ${label} (${timeoutMs}ms)`)), timeoutMs)
    );
    return Promise.race([promise, timeout]);
}

/** Chronometre un appel API */
async function timedFetch<T>(
    source: string,
    fn: () => Promise<T>
): Promise<{ result: T | null; hunt: APIHuntResult }> {
    const start = Date.now();
    try {
        const result = await withTimeout(fn(), API_TIMEOUT_MS, source);
        return {
            result,
            hunt: {
                source,
                status: "success",
                fetchedAt: new Date().toISOString(),
                durationMs: Date.now() - start,
                data: null, // Sera rempli par l'appelant
            },
        };
    } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes("Timeout");
        return {
            result: null,
            hunt: {
                source,
                status: isTimeout ? "timeout" : "error",
                fetchedAt: new Date().toISOString(),
                durationMs: Date.now() - start,
                data: null,
                error: error instanceof Error ? error.message : "Erreur inconnue",
            },
        };
    }
}

function makeSourced<T>(value: T | null | undefined, origin: "api" | "manual" | "estimated" | "fallback", source: string, confidence: number): SourcedData<T> {
    return {
        value: value ?? null,
        origin: value != null ? origin : null,
        source: value != null ? source : null,
        confidence: value != null ? confidence : null,
    };
}

// =============================================================================
// ETAPE 1: LE TIR DE BARRAGE (Chasse aux donnees)
// =============================================================================

interface HuntContext {
    normalizedAddress: string | null;
    coordinates: { latitude: number; longitude: number } | null;
    postalCode: string | null;
    city: string | null;
    cityCode: string | null;
    goldenData: GoldenData;
    enrichment: AuditEnrichment;
    sources: EnrichmentSource[];
    huntResults: HuntResults;
}

/**
 * Phase 1: Tir de Barrage
 * Interroge toutes les APIs en parallele.
 * Ne lance JAMAIS d'exception — chaque echec est capture et logue.
 */
async function executeHunt(request: AuditFlashInitRequest): Promise<HuntContext> {
    const ctx: HuntContext = {
        normalizedAddress: null,
        coordinates: null,
        postalCode: null,
        city: null,
        cityCode: null,
        goldenData: {
            surfaceHabitable: makeSourced<number>(null, "api", "", 0),
            constructionYear: makeSourced<number>(null, "api", "", 0),
            dpe: { ...makeSourced<DPELetter>(null, "api", "", 0) },
            pricePerSqm: { ...makeSourced<number>(null, "api", "", 0) },
        },
        enrichment: {
            cadastreParcelId: null,
            cadastreSurfaceTerrain: null,
            numberOfUnits: request.numberOfUnits ?? null,
            heatingSystem: null,
        },
        sources: [],
        huntResults: {
            ban: { source: "BAN", status: "error", fetchedAt: new Date().toISOString(), durationMs: 0, data: null },
            cadastre: { source: "Cadastre", status: "error", fetchedAt: new Date().toISOString(), durationMs: 0, data: null },
            dvf: { source: "DVF", status: "error", fetchedAt: new Date().toISOString(), durationMs: 0, data: null },
            ademe: { source: "ADEME", status: "error", fetchedAt: new Date().toISOString(), durationMs: 0, data: null },
            rnic: { source: "RNIC", status: "error", fetchedAt: new Date().toISOString(), durationMs: 0, data: null },
        },
    };

    // =========================================================================
    // TIR 1: Normalisation d'adresse (BAN) — PREREQUIS pour les autres tirs
    // =========================================================================
    const banResult = await timedFetch("BAN", () => normalizeAddress(request.address));

    if (banResult.result?.success && banResult.result.data) {
        const addressData = extractAddressData(banResult.result.data);
        ctx.normalizedAddress = addressData.fullAddress;
        ctx.postalCode = addressData.postalCode;
        ctx.city = addressData.city;
        ctx.cityCode = addressData.cityCode;
        ctx.coordinates = addressData.coordinates;
        ctx.sources.push(banResult.result.source);
        ctx.huntResults.ban = { ...banResult.hunt, status: "success", data: addressData as unknown as Record<string, unknown> };
    } else {
        ctx.huntResults.ban = banResult.hunt;
        // Plan B: on continue sans geolocalisation, les autres APIs ne marcheront pas en geo
        // mais on peut tenter par code postal / adresse textuelle
    }

    // =========================================================================
    // TIR 2-5: Tirs en parallele (Cadastre, DVF, ADEME, RNIC)
    // Chaque tir est independant et ne bloque pas les autres
    // =========================================================================
    const parallelResults = await Promise.allSettled([
        // TIR 2: Cadastre (necessite coordonnees)
        ctx.coordinates
            ? timedFetch("Cadastre", () =>
                searchCadastreByCoordinates(
                    ctx.coordinates!.longitude,
                    ctx.coordinates!.latitude
                )
            )
            : Promise.resolve(null),

        // TIR 3: DVF (necessite coordonnees ou code commune)
        ctx.coordinates
            ? timedFetch("DVF", () =>
                searchDVFWithFallback(
                    ctx.coordinates!.latitude,
                    ctx.coordinates!.longitude,
                    ctx.cityCode ?? undefined,
                    { typeLocal: "Appartement" }
                )
            )
            : Promise.resolve(null),

        // TIR 4: ADEME DPE (par coordonnees ou par adresse)
        ctx.coordinates
            ? timedFetch("ADEME", () =>
                searchDPEByLocation({
                    latitude: ctx.coordinates!.latitude,
                    longitude: ctx.coordinates!.longitude,
                    radius: 100,
                    limit: 20,
                })
            )
            : ctx.postalCode
                ? timedFetch("ADEME", () =>
                    searchDPEByAddress({
                        query: request.address,
                        codePostal: ctx.postalCode!,
                        limit: 10,
                    })
                )
                : Promise.resolve(null),
    ]);

    // =========================================================================
    // EXTRACTION: Cadastre
    // =========================================================================
    const cadastreSettled = parallelResults[0];
    if (cadastreSettled?.status === "fulfilled" && cadastreSettled.value) {
        const cadastre = cadastreSettled.value as Awaited<ReturnType<typeof timedFetch<Awaited<ReturnType<typeof searchCadastreByCoordinates>>>>>;
        if (cadastre.result?.success && cadastre.result.data.mainParcel) {
            const parcel = cadastre.result.data.mainParcel;
            ctx.enrichment.cadastreParcelId = parcel.properties.id;
            ctx.enrichment.cadastreSurfaceTerrain = parcel.properties.contenance;

            // Surface terrain != surface habitable, mais c'est un indice
            // On ne l'utilise PAS comme surface_habitable (doctrine: zero bullshit)
            ctx.sources.push(cadastre.result.source);
            ctx.huntResults.cadastre = {
                ...cadastre.hunt,
                status: "success",
                data: { parcelId: parcel.properties.id, contenance: parcel.properties.contenance },
            };
        } else {
            ctx.huntResults.cadastre = cadastre.hunt;
        }
    }

    // =========================================================================
    // EXTRACTION: DVF (Prix m2)
    // =========================================================================
    const dvfSettled = parallelResults[1];
    if (dvfSettled?.status === "fulfilled" && dvfSettled.value) {
        const dvf = dvfSettled.value as Awaited<ReturnType<typeof timedFetch<Awaited<ReturnType<typeof searchDVFWithFallback>>>>>;
        if (dvf.result?.success && dvf.result.data.length > 0) {
            const stats = calculateDVFStats(dvf.result.data, {
                typeLocal: "Appartement",
                yearsBack: 3,
            });

            if (stats && stats.averagePricePerSqm > 0) {
                ctx.goldenData.pricePerSqm = {
                    ...makeSourced(stats.averagePricePerSqm, "api", "DVF Etalab", 0.85),
                    transactionCount: stats.transactionCount,
                    dateRange: stats.periodCovered,
                };
                ctx.sources.push(dvf.result.source);
                ctx.huntResults.dvf = {
                    ...dvf.hunt,
                    status: "success",
                    data: stats as unknown as Record<string, unknown>,
                };
            } else {
                ctx.huntResults.dvf = { ...dvf.hunt, status: "partial" };
            }
        } else {
            ctx.huntResults.dvf = dvf.hunt;
        }
    }

    // =========================================================================
    // EXTRACTION: ADEME DPE (DPE, Surface, Annee construction, Chauffage)
    // C'est l'API la plus riche: elle peut fournir 3 Golden Datas d'un coup
    // =========================================================================
    const ademeSettled = parallelResults[2];
    if (ademeSettled?.status === "fulfilled" && ademeSettled.value) {
        const ademe = ademeSettled.value as Awaited<ReturnType<typeof timedFetch<Awaited<ReturnType<typeof searchDPEByLocation>>>>>;
        if (ademe.result?.success && ademe.result.data.length > 0) {
            // Trouver le DPE le plus pertinent (le plus recent, le plus proche de l'adresse)
            const bestDPE = findBestDPE(ademe.result.data, request.address);

            if (bestDPE) {
                // GOLDEN DATA 3: DPE
                if (bestDPE.etiquette_dpe && isValidDPE(bestDPE.etiquette_dpe)) {
                    ctx.goldenData.dpe = {
                        ...makeSourced(bestDPE.etiquette_dpe as DPELetter, "api", "API ADEME DPE", 0.90),
                        numeroDpe: bestDPE.numero_dpe,
                        dateEtablissement: bestDPE.date_etablissement_dpe,
                        consommation: bestDPE.consommation_energie_finale,
                        ges: bestDPE.etiquette_ges,
                    };
                }

                // GOLDEN DATA 1: Surface (si disponible dans le DPE)
                if (bestDPE.surface_habitable && bestDPE.surface_habitable > 0) {
                    ctx.goldenData.surfaceHabitable = makeSourced(
                        bestDPE.surface_habitable,
                        "api",
                        "API ADEME DPE",
                        0.80
                    );
                }

                // GOLDEN DATA 2: Annee de construction
                if (bestDPE.annee_construction && bestDPE.annee_construction > 1800) {
                    ctx.goldenData.constructionYear = makeSourced(
                        bestDPE.annee_construction,
                        "api",
                        "API ADEME DPE",
                        0.85
                    );
                }

                // Enrichment: chauffage
                if (bestDPE.type_chauffage) {
                    ctx.enrichment.heatingSystem = bestDPE.type_chauffage;
                }

                ctx.sources.push(ademe.result.source);
                ctx.huntResults.ademe = {
                    ...ademe.hunt,
                    status: "success",
                    data: {
                        dpe: bestDPE.etiquette_dpe,
                        surface: bestDPE.surface_habitable,
                        annee: bestDPE.annee_construction,
                        numeroDpe: bestDPE.numero_dpe,
                        totalResults: ademe.result.data.length,
                    },
                };
            } else {
                ctx.huntResults.ademe = { ...ademe.hunt, status: "partial" };
            }
        } else {
            ctx.huntResults.ademe = ademe.hunt;
        }
    }

    return ctx;
}

// =============================================================================
// HELPERS POUR L'EXTRACTION ADEME
// =============================================================================

/** Trouve le DPE le plus pertinent parmi les resultats */
function findBestDPE(
    entries: AdemeDPEEntry[],
    rawAddress: string
): AdemeDPEEntry | null {
    if (entries.length === 0) return null;

    // Filtrer les DPE valides uniquement
    const valid = entries.filter((e) => e.is_valid && e.etiquette_dpe);

    if (valid.length === 0) {
        // Fallback: prendre le plus recent meme si expire
        const sorted = [...entries]
            .filter((e) => e.etiquette_dpe)
            .sort((a, b) =>
                (b.date_etablissement_dpe || "").localeCompare(a.date_etablissement_dpe || "")
            );
        return sorted[0] ?? null;
    }

    // Scorer chaque DPE par pertinence
    const scored = valid.map((entry) => {
        let score = 0;

        // Bonus: adresse similaire
        const normalizedEntry = (entry.adresse_brute || "").toLowerCase();
        const normalizedSearch = rawAddress.toLowerCase();
        if (normalizedEntry.includes(normalizedSearch) || normalizedSearch.includes(normalizedEntry)) {
            score += 10;
        }

        // Bonus: DPE recent
        if (entry.date_etablissement_dpe) {
            const year = new Date(entry.date_etablissement_dpe).getFullYear();
            score += Math.max(0, year - 2020); // Plus c'est recent, mieux c'est
        }

        // Bonus: surface renseignee
        if (entry.surface_habitable && entry.surface_habitable > 0) {
            score += 3;
        }

        // Bonus: annee de construction renseignee
        if (entry.annee_construction) {
            score += 2;
        }

        // Bonus: type immeuble (on cherche des copros)
        if (entry.type_batiment === "immeuble" || entry.type_batiment === "appartement") {
            score += 2;
        }

        return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.entry ?? null;
}

function isValidDPE(value: string): value is DPELetter {
    return ["A", "B", "C", "D", "E", "F", "G"].includes(value);
}

// =============================================================================
// ETAPE 2: LE CHECKPOINT DE VERITE
// =============================================================================

interface CheckpointResult {
    status: "DRAFT" | "READY";
    missingFields: MissingField[];
}

/**
 * Phase 2: Checkpoint de Verite
 * Verifie que les 4 Golden Datas sont presentes et coherentes.
 * Si une donnee manque -> DRAFT + liste des champs a remplir manuellement.
 */
function checkpointDeVerite(goldenData: GoldenData): CheckpointResult {
    const missingFields: MissingField[] = [];

    // CHECK 1: Surface habitable
    if (!goldenData.surfaceHabitable.value || goldenData.surfaceHabitable.value <= 0) {
        missingFields.push({
            field: "surface_habitable",
            label: "Surface habitable (m2)",
            reason: "Impossible de determiner la surface habitable via les APIs publiques (Cadastre/ADEME). La surface terrain du cadastre n'est pas la surface habitable.",
            inputType: "number",
            placeholder: "Ex: 2500 (surface totale du batiment en m2)",
        });
    }

    // CHECK 2: Annee de construction
    if (!goldenData.constructionYear.value) {
        missingFields.push({
            field: "construction_year",
            label: "Annee de construction",
            reason: "Aucune donnee d'annee de construction trouvee dans les bases ADEME/BDNB/Cadastre.",
            inputType: "number",
            placeholder: "Ex: 1975",
        });
    }

    // CHECK 3: Classe DPE
    if (!goldenData.dpe.value) {
        missingFields.push({
            field: "dpe_current",
            label: "Classe DPE actuelle",
            reason: "Aucun DPE trouve pour cette adresse dans la base ADEME.",
            inputType: "select",
            options: ["A", "B", "C", "D", "E", "F", "G"],
        });
    }

    // CHECK 4: Prix au m2
    if (!goldenData.pricePerSqm.value || goldenData.pricePerSqm.value <= 0) {
        missingFields.push({
            field: "price_per_sqm",
            label: "Prix au m2 du quartier",
            reason: "Pas assez de transactions DVF dans le secteur pour etablir un prix fiable.",
            inputType: "number",
            placeholder: "Ex: 3200 (en EUR/m2)",
        });
    }

    return {
        status: missingFields.length > 0 ? "DRAFT" : "READY",
        missingFields,
    };
}

// =============================================================================
// ETAPE 3: LE MOTEUR VALOSYNDIC
// =============================================================================

/**
 * Phase 3: Lance le calcul ValoSyndic si toutes les Golden Datas sont presentes.
 * Utilise le moteur existant (calculator.ts) pour garantir la coherence.
 */
function runValoSyndicEngine(
    goldenData: GoldenData,
    enrichment: AuditEnrichment,
    targetDPE: DPELetter
): AuditComputation | null {
    const surface = goldenData.surfaceHabitable.value;
    const constructionYear = goldenData.constructionYear.value;
    const dpeCurrent = goldenData.dpe.value;
    const pricePerSqm = goldenData.pricePerSqm.value;

    // Double verification (defense en profondeur)
    if (!surface || !constructionYear || !dpeCurrent || !pricePerSqm) {
        return null;
    }

    // Nombre de lots: RNIC ou estimation conservatrice
    const numberOfUnits = enrichment.numberOfUnits ?? estimateUnitsFromSurface(surface);

    // Cout travaux: 180 EUR/m2 hab (ITE + VMC)
    const estimatedCostHT = surface * RENO_COST_PER_SQM;

    // Surface moyenne par lot
    const averageUnitSurface = numberOfUnits > 0 ? surface / numberOfUnits : surface;

    // Construire l'input pour le moteur existant
    const input: DiagnosticInput = {
        currentDPE: dpeCurrent,
        targetDPE: targetDPE,
        numberOfUnits: numberOfUnits,
        estimatedCostHT: estimatedCostHT,
        averageUnitSurface: averageUnitSurface,
        averagePricePerSqm: pricePerSqm,
        priceSource: goldenData.pricePerSqm.origin === "api" ? "DVF" : "Manuel",
    };

    // Mapper le chauffage si disponible
    if (enrichment.heatingSystem) {
        const heatingMap: Record<string, DiagnosticInput["heatingSystem"]> = {
            "electrique": "electrique",
            "gaz": "gaz",
            "fioul": "fioul",
            "bois": "bois",
            "reseau de chaleur": "urbain",
        };
        const normalized = enrichment.heatingSystem.toLowerCase();
        for (const [key, value] of Object.entries(heatingMap)) {
            if (normalized.includes(key)) {
                input.heatingSystem = value;
                break;
            }
        }
    }

    // Lancer le moteur
    const result = generateDiagnostic(input);

    return {
        simulation: {
            worksCostHT: result.financing.worksCostHT,
            worksCostTTC: result.financing.totalCostTTC,
            mprAmount: result.financing.mprAmount,
            ceeAmount: result.financing.ceeAmount,
            remainingCost: result.financing.remainingCost,
            ecoPtzAmount: result.financing.ecoPtzAmount,
            monthlyPayment: result.financing.monthlyPayment,
            monthlyEnergySavings: result.financing.monthlyEnergySavings,
            netMonthlyCashFlow: result.financing.netMonthlyCashFlow,
        },
        valuation: {
            currentValue: result.valuation.currentValue,
            projectedValue: result.valuation.projectedValue,
            greenValueGain: result.valuation.greenValueGain,
            greenValuePercent: result.valuation.greenValueGainPercent,
            netROI: result.valuation.netROI,
        },
        inactionCost: {
            projectedCost3y: result.inactionCost.projectedCost3Years,
            inflationCost: result.inactionCost.projectedCost3Years - result.inactionCost.currentCost,
            valueDepreciation: result.inactionCost.valueDepreciation,
            total: result.inactionCost.totalInactionCost,
        },
        compliance: {
            isProhibited: result.compliance.isProhibited,
            prohibitionDate: result.compliance.prohibitionDate?.toISOString() ?? null,
            urgencyLevel: result.compliance.urgencyLevel,
            statusLabel: result.compliance.statusLabel,
        },
    };
}

/** Estimation conservatrice du nombre de lots a partir de la surface */
function estimateUnitsFromSurface(totalSurface: number): number {
    // Hypothese: 65m2 moyen par lot (standard copropriete francaise)
    const estimated = Math.max(1, Math.round(totalSurface / 65));
    return estimated;
}

// =============================================================================
// POINT D'ENTREE PRINCIPAL
// =============================================================================

/**
 * Initialise un Audit Flash a partir d'une adresse brute.
 *
 * Flux:
 * 1. Tir de Barrage -> Interroge BAN + Cadastre + DVF + ADEME en parallele
 * 2. Checkpoint de Verite -> Verifie les 4 Golden Datas
 * 3. Si READY -> Lance le moteur ValoSyndic
 * 4. Si DRAFT -> Renvoie la liste des champs manquants (Plan B)
 */
export async function initAuditFlash(
    request: AuditFlashInitRequest
): Promise<AuditFlashInitResponse> {
    const targetDPE: DPELetter = request.targetDPE ?? "C";

    // ETAPE 1: Tir de barrage
    const ctx = await executeHunt(request);

    // ETAPE 2: Checkpoint de verite
    const checkpoint = checkpointDeVerite(ctx.goldenData);

    // ETAPE 3: Moteur ValoSyndic (si READY)
    let computation: AuditComputation | null = null;
    let finalStatus: AuditFlashStatus = checkpoint.status;

    if (checkpoint.status === "READY") {
        computation = runValoSyndicEngine(ctx.goldenData, ctx.enrichment, targetDPE);
        if (computation) {
            finalStatus = "COMPLETED" as AuditFlashStatus;
        }
    }

    // Generer un UUID cote serveur
    const auditId = crypto.randomUUID();

    return {
        auditId,
        status: finalStatus,
        normalizedAddress: ctx.normalizedAddress,
        coordinates: ctx.coordinates,
        postalCode: ctx.postalCode,
        city: ctx.city,
        cityCode: ctx.cityCode,
        goldenData: ctx.goldenData,
        missingFields: checkpoint.missingFields,
        enrichment: ctx.enrichment,
        computation,
        sources: ctx.sources,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Complete un Audit Flash avec des donnees manuelles (Plan B, Step 2).
 * Fusionne les donnees manuelles avec les donnees existantes et relance le calcul.
 */
export function completeAuditFlash(
    existingGoldenData: GoldenData,
    existingEnrichment: AuditEnrichment,
    manualData: {
        surfaceHabitable?: number;
        constructionYear?: number;
        dpeCurrent?: DPELetter;
        pricePerSqm?: number;
        numberOfUnits?: number;
    },
    targetDPE: DPELetter = "C"
): { goldenData: GoldenData; enrichment: AuditEnrichment; computation: AuditComputation | null; missingFields: MissingField[] } {
    // Fusionner: les donnees manuelles remplissent les trous
    const merged: GoldenData = {
        surfaceHabitable: existingGoldenData.surfaceHabitable.value
            ? existingGoldenData.surfaceHabitable
            : manualData.surfaceHabitable
                ? makeSourced(manualData.surfaceHabitable, "manual", "Saisie manuelle", 1.0)
                : existingGoldenData.surfaceHabitable,

        constructionYear: existingGoldenData.constructionYear.value
            ? existingGoldenData.constructionYear
            : manualData.constructionYear
                ? makeSourced(manualData.constructionYear, "manual", "Saisie manuelle", 1.0)
                : existingGoldenData.constructionYear,

        dpe: existingGoldenData.dpe.value
            ? existingGoldenData.dpe
            : manualData.dpeCurrent
                ? { ...makeSourced(manualData.dpeCurrent, "manual", "Saisie manuelle", 1.0) }
                : existingGoldenData.dpe,

        pricePerSqm: existingGoldenData.pricePerSqm.value
            ? existingGoldenData.pricePerSqm
            : manualData.pricePerSqm
                ? { ...makeSourced(manualData.pricePerSqm, "manual", "Saisie manuelle", 1.0) }
                : existingGoldenData.pricePerSqm,
    };

    // MAJ enrichment si nb lots fourni
    const mergedEnrichment: AuditEnrichment = {
        ...existingEnrichment,
        numberOfUnits: manualData.numberOfUnits ?? existingEnrichment.numberOfUnits,
    };

    // Re-checkpoint
    const checkpoint = checkpointDeVerite(merged);

    // Re-calcul si READY
    let computation: AuditComputation | null = null;
    if (checkpoint.status === "READY") {
        computation = runValoSyndicEngine(merged, mergedEnrichment, targetDPE);
    }

    return {
        goldenData: merged,
        enrichment: mergedEnrichment,
        computation,
        missingFields: checkpoint.missingFields,
    };
}
