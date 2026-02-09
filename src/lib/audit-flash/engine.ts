/**
 * VALO-SYNDIC — Audit Flash Engine
 * =================================
 * Le Chasseur: orchestre la chasse aux donnees et le moteur de calcul.
 *
 * DOCTRINE:
 * 1. Tir de Barrage: Interroge en parallele BAN, Cadastre, DVF, ADEME
 * 2. Checkpoint de Verite: SI Golden Data manquante -> DRAFT + Plan B
 * 3. Si tout est plein -> READY -> Lance le moteur ValoSyndic
 *
 * ENDPOINTS API GRATUITS:
 * | API           | URL                                    | Cle? |
 * |---------------|----------------------------------------|------|
 * | BAN           | https://api-adresse.data.gouv.fr       | Non  |
 * | Cadastre IGN  | https://apicarto.ign.fr/api/cadastre   | Non  |
 * | DVF Etalab    | https://api.dvf.etalab.gouv.fr         | Non  |
 * | ADEME DPE     | https://data.ademe.fr/data-fair/api/v1 | Non  |
 */

import { normalizeAddress, extractAddressData } from "@/lib/api/addressService";
import { searchCadastreByCoordinates } from "@/lib/api/cadastreService";
import { searchDVFWithFallback, calculateDVFStats } from "@/lib/api/dvfService";
import { searchDPEByAddress, searchDPEByLocation } from "@/lib/api/ademeDpeService";
import type { AdemeDPEEntry } from "@/lib/api/ademeDpeService";
import type { EnrichmentSource } from "@/lib/api/types";
import type { DPELetter } from "@/lib/constants";
import { generateDiagnostic } from "@/lib/calculator";
import type { DiagnosticInput } from "@/lib/schemas";
import { getGlobalSettings } from "./settings";

import type {
    AuditFlashStatus,
    AuditFlashInitRequest,
    AuditFlashInitResponse,
    GoldenData,
    MissingField,
    AuditComputation,
    AuditEnrichment,
    APIHuntResult,
    AuditFlashRow,
    SourcedData,
} from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const API_TIMEOUT_MS = 10_000;

// =============================================================================
// HELPERS
// =============================================================================

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
                data: null,
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

function makeSourced<T>(
    value: T | null | undefined,
    origin: "api" | "manual" | "estimated" | "fallback",
    source: string,
    confidence: number
): SourcedData<T> {
    return {
        value: value ?? null,
        origin: value != null ? origin : null,
        source: value != null ? source : null,
        confidence: value != null ? confidence : null,
    };
}

// =============================================================================
// ETAPE 1: TIR DE BARRAGE
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
    apiResponses: Record<string, APIHuntResult>;
}

async function executeHunt(request: AuditFlashInitRequest, settings: Awaited<ReturnType<typeof getGlobalSettings>>): Promise<HuntContext> {
    const now = new Date().toISOString();
    const emptyHunt = (s: string): APIHuntResult => ({
        source: s, status: "error", fetchedAt: now, durationMs: 0, data: null,
    });

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
        apiResponses: {
            ban: emptyHunt("BAN"),
            cadastre: emptyHunt("Cadastre"),
            dvf: emptyHunt("DVF"),
            ademe: emptyHunt("ADEME"),
        },
    };

    // TIR 1: BAN (prerequis pour les coordonnees)
    const banResult = await timedFetch("BAN", () => normalizeAddress(request.address));

    if (banResult.result?.success && banResult.result.data) {
        const ad = extractAddressData(banResult.result.data);
        ctx.normalizedAddress = ad.fullAddress;
        ctx.postalCode = ad.postalCode;
        ctx.city = ad.city;
        ctx.cityCode = ad.cityCode;
        ctx.coordinates = ad.coordinates;
        ctx.sources.push(banResult.result.source);
        ctx.apiResponses.ban = { ...banResult.hunt, status: "success", data: ad as unknown as Record<string, unknown> };
    } else {
        ctx.apiResponses.ban = banResult.hunt;
        // FALLBACK: Tentative d'extraction du Code Postal via Regex si BAN échoue
        const cpMatch = request.address.match(/\b\d{5}\b/);
        if (cpMatch) {
            ctx.postalCode = cpMatch[0];
        }
    }

    // TIR 2-4: Parallele (Cadastre, DVF, ADEME)
    const parallelResults = await Promise.allSettled([
        ctx.coordinates
            ? timedFetch("Cadastre", () =>
                searchCadastreByCoordinates(ctx.coordinates!.longitude, ctx.coordinates!.latitude))
            : Promise.resolve(null),

        ctx.coordinates
            ? timedFetch("DVF", () =>
                searchDVFWithFallback(
                    ctx.coordinates!.latitude, ctx.coordinates!.longitude,
                    ctx.cityCode ?? undefined, { typeLocal: "Appartement" }))
            : Promise.resolve(null),

        ctx.coordinates
            ? timedFetch("ADEME", () =>
                searchDPEByLocation({
                    latitude: ctx.coordinates!.latitude,
                    longitude: ctx.coordinates!.longitude,
                    radius: 100, limit: 20,
                }))
            : ctx.postalCode
                ? timedFetch("ADEME", () =>
                    searchDPEByAddress({ query: request.address, codePostal: ctx.postalCode!, limit: 10 }))
                : Promise.resolve(null),
    ]);

    // EXTRACTION: Cadastre
    const cadastreSettled = parallelResults[0];
    if (cadastreSettled?.status === "fulfilled" && cadastreSettled.value) {
        const cadastre = cadastreSettled.value as Awaited<ReturnType<typeof timedFetch<Awaited<ReturnType<typeof searchCadastreByCoordinates>>>>>;
        if (cadastre.result?.success && cadastre.result.data.mainParcel) {
            const parcel = cadastre.result.data.mainParcel;
            ctx.enrichment.cadastreParcelId = parcel.properties.id;
            ctx.enrichment.cadastreSurfaceTerrain = parcel.properties.contenance;
            ctx.sources.push(cadastre.result.source);
            ctx.apiResponses.cadastre = {
                ...cadastre.hunt, status: "success",
                data: { parcelId: parcel.properties.id, contenance: parcel.properties.contenance },
            };
        } else {
            ctx.apiResponses.cadastre = cadastre.hunt;
        }
    }

    // EXTRACTION: DVF
    const dvfSettled = parallelResults[1];
    if (dvfSettled?.status === "fulfilled" && dvfSettled.value) {
        const dvf = dvfSettled.value as Awaited<ReturnType<typeof timedFetch<Awaited<ReturnType<typeof searchDVFWithFallback>>>>>;
        if (dvf.result?.success && dvf.result.data.length > 0) {
            const stats = calculateDVFStats(dvf.result.data, { typeLocal: "Appartement", yearsBack: 3 });
            if (stats && stats.averagePricePerSqm > 0) {
                ctx.goldenData.pricePerSqm = {
                    ...makeSourced(stats.averagePricePerSqm, "api", "DVF Etalab", 0.85),
                    transactionCount: stats.transactionCount,
                    dateRange: stats.periodCovered,
                };
                ctx.sources.push(dvf.result.source);
                ctx.apiResponses.dvf = { ...dvf.hunt, status: "success", data: stats as unknown as Record<string, unknown> };
            } else {
                ctx.apiResponses.dvf = { ...dvf.hunt, status: "partial" };
            }
        } else {
            ctx.apiResponses.dvf = dvf.hunt;
        }
    }

    // DVF FALLBACK: Si aucun prix trouvé, utiliser base_price_per_sqm depuis global_settings
    if (!ctx.goldenData.pricePerSqm.value || ctx.goldenData.pricePerSqm.value <= 0) {
        ctx.goldenData.pricePerSqm = makeSourced(
            settings.base_price_per_sqm,
            "fallback",
            "Valeur par défaut (global_settings)",
            0.50
        );
    }

    // EXTRACTION: ADEME (peut fournir 3 Golden Datas d'un coup)
    const ademeSettled = parallelResults[2];
    if (ademeSettled?.status === "fulfilled" && ademeSettled.value) {
        const ademe = ademeSettled.value as Awaited<ReturnType<typeof timedFetch<Awaited<ReturnType<typeof searchDPEByLocation>>>>>;
        if (ademe.result?.success && ademe.result.data.length > 0) {
            const bestDPE = findBestDPE(ademe.result.data, request.address);
            if (bestDPE) {
                if (bestDPE.etiquette_dpe && isValidDPE(bestDPE.etiquette_dpe)) {
                    ctx.goldenData.dpe = {
                        ...makeSourced(bestDPE.etiquette_dpe as DPELetter, "api", "API ADEME DPE", 0.90),
                        numeroDpe: bestDPE.numero_dpe,
                        dateEtablissement: bestDPE.date_etablissement_dpe,
                        consommation: bestDPE.consommation_energie_finale,
                        ges: bestDPE.etiquette_ges,
                    };
                }
                if (bestDPE.surface_habitable && bestDPE.surface_habitable > 0) {
                    ctx.goldenData.surfaceHabitable = makeSourced(bestDPE.surface_habitable, "api", "API ADEME DPE", 0.80);
                }
                if (bestDPE.annee_construction && bestDPE.annee_construction > 1800) {
                    ctx.goldenData.constructionYear = makeSourced(bestDPE.annee_construction, "api", "API ADEME DPE", 0.85);
                }
                if (bestDPE.type_chauffage) {
                    ctx.enrichment.heatingSystem = bestDPE.type_chauffage;
                }
                ctx.sources.push(ademe.result.source);
                ctx.apiResponses.ademe = {
                    ...ademe.hunt, status: "success",
                    data: {
                        dpe: bestDPE.etiquette_dpe, surface: bestDPE.surface_habitable,
                        annee: bestDPE.annee_construction, numeroDpe: bestDPE.numero_dpe,
                        totalResults: ademe.result.data.length,
                    },
                };
            } else {
                ctx.apiResponses.ademe = { ...ademe.hunt, status: "partial" };
            }
        } else {
            ctx.apiResponses.ademe = ademe.hunt;
        }
    }

    return ctx;
}

// =============================================================================
// ADEME HELPERS
// =============================================================================

function findBestDPE(entries: AdemeDPEEntry[], rawAddress: string): AdemeDPEEntry | null {
    if (entries.length === 0) return null;

    const valid = entries.filter((e) => e.is_valid && e.etiquette_dpe);
    const pool = valid.length > 0
        ? valid
        : [...entries].filter((e) => e.etiquette_dpe).sort((a, b) =>
            (b.date_etablissement_dpe || "").localeCompare(a.date_etablissement_dpe || ""));

    if (pool.length === 0) return null;

    const scored = pool.map((entry) => {
        let score = 0;
        const ne = (entry.adresse_brute || "").toLowerCase();
        const ns = rawAddress.toLowerCase();
        if (ne.includes(ns) || ns.includes(ne)) score += 10;
        if (entry.date_etablissement_dpe) {
            score += Math.max(0, new Date(entry.date_etablissement_dpe).getFullYear() - 2020);
        }
        if (entry.surface_habitable && entry.surface_habitable > 0) score += 3;
        if (entry.annee_construction) score += 2;
        if (entry.type_batiment === "immeuble" || entry.type_batiment === "appartement") score += 2;
        return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.entry ?? null;
}

function isValidDPE(value: string): value is DPELetter {
    return ["A", "B", "C", "D", "E", "F", "G"].includes(value);
}

// =============================================================================
// ETAPE 2: CHECKPOINT DE VERITE
// =============================================================================

function checkpointDeVerite(goldenData: GoldenData): { status: "DRAFT" | "READY"; missingFields: MissingField[] } {
    const missingFields: MissingField[] = [];

    if (!goldenData.surfaceHabitable.value || goldenData.surfaceHabitable.value <= 0) {
        missingFields.push({
            field: "surface_habitable",
            label: "Surface habitable (m2)",
            reason: "Impossible de determiner la surface habitable via les APIs publiques.",
            inputType: "number",
            placeholder: "Ex: 2500",
        });
    }
    if (!goldenData.constructionYear.value) {
        missingFields.push({
            field: "construction_year",
            label: "Annee de construction",
            reason: "Aucune donnee d'annee de construction trouvee dans les bases publiques.",
            inputType: "number",
            placeholder: "Ex: 1975",
        });
    }
    if (!goldenData.dpe.value) {
        missingFields.push({
            field: "dpe_current",
            label: "Classe DPE actuelle",
            reason: "Aucun DPE trouve pour cette adresse dans la base ADEME.",
            inputType: "select",
            options: ["A", "B", "C", "D", "E", "F", "G"],
        });
    }
    if (!goldenData.pricePerSqm.value || goldenData.pricePerSqm.value <= 0) {
        missingFields.push({
            field: "price_per_sqm",
            label: "Prix au m2 du quartier",
            reason: "Pas assez de transactions DVF pour etablir un prix fiable.",
            inputType: "number",
            placeholder: "Ex: 3200",
        });
    }

    return {
        status: missingFields.length > 0 ? "DRAFT" : "READY",
        missingFields,
    };
}

// =============================================================================
// ETAPE 3: MOTEUR VALOSYNDIC
// =============================================================================

function runValoSyndicEngine(
    goldenData: GoldenData,
    enrichment: AuditEnrichment,
    targetDPE: DPELetter,
    settings: Awaited<ReturnType<typeof getGlobalSettings>>
): AuditComputation | null {
    const surface = goldenData.surfaceHabitable.value;
    const dpeCurrent = goldenData.dpe.value;
    const pricePerSqm = goldenData.pricePerSqm.value;

    if (!surface || !dpeCurrent || !pricePerSqm) return null;

    const numberOfUnits = enrichment.numberOfUnits ?? Math.max(1, Math.round(surface / 65));
    const estimatedCostHT = surface * settings.reno_cost_per_sqm;
    const averageUnitSurface = numberOfUnits > 0 ? surface / numberOfUnits : surface;

    const input: DiagnosticInput = {
        currentDPE: dpeCurrent,
        targetDPE: targetDPE,
        numberOfUnits: numberOfUnits,
        commercialLots: 0,
        estimatedCostHT: estimatedCostHT,
        localAidAmount: 0,
        alurFund: 0,
        ceeBonus: 0,
        currentEnergyBill: 0,
        investorRatio: 0,
        isCostTTC: true,
        includeHonoraires: true,
        averageUnitSurface: averageUnitSurface,
        averagePricePerSqm: pricePerSqm,
        priceSource: goldenData.pricePerSqm.origin === "api" ? "DVF" : "Manuel",
    };

    if (enrichment.heatingSystem) {
        const heatingMap: Record<string, DiagnosticInput["heatingSystem"]> = {
            "electrique": "electrique", "gaz": "gaz", "fioul": "fioul",
            "bois": "bois", "reseau de chaleur": "urbain",
        };
        const normalized = enrichment.heatingSystem.toLowerCase();
        for (const [key, value] of Object.entries(heatingMap)) {
            if (normalized.includes(key)) { input.heatingSystem = value; break; }
        }
    }

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

// =============================================================================
// POINT D'ENTREE: initAuditFlash
// =============================================================================

export async function initAuditFlash(
    request: AuditFlashInitRequest
): Promise<AuditFlashInitResponse> {
    const targetDPE: DPELetter = request.targetDPE ?? "C";
    const auditId = crypto.randomUUID();

    try {
        // ETAPE 0: Récupérer les paramètres globaux
        const settings = await getGlobalSettings();

        // ETAPE 1: Tir de barrage
        const ctx = await executeHunt(request, settings);

        // ETAPE 2: Checkpoint de verite
        const checkpoint = checkpointDeVerite(ctx.goldenData);

        // ETAPE 3: Moteur ValoSyndic (si READY)
        let computation: AuditComputation | null = null;
        let finalStatus: AuditFlashStatus = checkpoint.status;

        if (checkpoint.status === "READY") {
            computation = runValoSyndicEngine(ctx.goldenData, ctx.enrichment, targetDPE, settings);
            if (computation) {
                finalStatus = "COMPLETED" as AuditFlashStatus;
            }
        }

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
            apiResponses: ctx.apiResponses,
            createdAt: new Date().toISOString(),
        };
    } catch (error) {
        // PLAN B: En cas d'échec complet, retourner un état DRAFT avec toutes les données manquantes
        console.error("[AUDIT FLASH] Fatal error during initialization, returning DRAFT state:", error);

        const now = new Date().toISOString();
        const emptySourced = <T,>(v: T | null): SourcedData<T> => ({
            value: v,
            origin: null,
            source: null,
            confidence: null,
        });

        return {
            auditId,
            status: "DRAFT",
            normalizedAddress: null,
            coordinates: null,
            postalCode: null,
            city: null,
            cityCode: null,
            goldenData: {
                surfaceHabitable: emptySourced<number>(null),
                constructionYear: emptySourced<number>(null),
                dpe: emptySourced<DPELetter>(null),
                pricePerSqm: emptySourced<number>(null),
            },
            missingFields: [
                {
                    field: "surface_habitable",
                    label: "Surface habitable (m²)",
                    reason: "APIs indisponibles, veuillez saisir manuellement.",
                    inputType: "number",
                    placeholder: "Ex: 2500",
                },
                {
                    field: "construction_year",
                    label: "Année de construction",
                    reason: "APIs indisponibles, veuillez saisir manuellement.",
                    inputType: "number",
                    placeholder: "Ex: 1975",
                },
                {
                    field: "dpe_current",
                    label: "Classe DPE actuelle",
                    reason: "APIs indisponibles, veuillez saisir manuellement.",
                    inputType: "select",
                    options: ["A", "B", "C", "D", "E", "F", "G"],
                },
                {
                    field: "price_per_sqm",
                    label: "Prix au m² du quartier",
                    reason: "APIs indisponibles, veuillez saisir manuellement.",
                    inputType: "number",
                    placeholder: "Ex: 3200",
                },
            ],
            enrichment: {
                cadastreParcelId: null,
                cadastreSurfaceTerrain: null,
                numberOfUnits: request.numberOfUnits ?? null,
                heatingSystem: null,
            },
            computation: null,
            sources: [],
            apiResponses: {},
            createdAt: now,
        };
    }
}

// =============================================================================
// POINT D'ENTREE: completeAuditFlash
// =============================================================================

export async function completeAuditFlash(
    existingGoldenData: GoldenData,
    existingEnrichment: AuditEnrichment,
    manualData: {
        surfaceHabitable?: number | undefined;
        constructionYear?: number | undefined;
        dpeCurrent?: DPELetter | undefined;
        pricePerSqm?: number | undefined;
        numberOfUnits?: number | undefined;
    },
    targetDPE: DPELetter = "C"
): Promise<{ goldenData: GoldenData; enrichment: AuditEnrichment; computation: AuditComputation | null; missingFields: MissingField[] }> {
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

    const mergedEnrichment: AuditEnrichment = {
        ...existingEnrichment,
        numberOfUnits: manualData.numberOfUnits ?? existingEnrichment.numberOfUnits,
    };

    // Récupérer les paramètres globaux
    const settings = await getGlobalSettings();

    const checkpoint = checkpointDeVerite(merged);
    let computation: AuditComputation | null = null;
    if (checkpoint.status === "READY") {
        computation = runValoSyndicEngine(merged, mergedEnrichment, targetDPE, settings);
    }

    return { goldenData: merged, enrichment: mergedEnrichment, computation, missingFields: checkpoint.missingFields };
}

// =============================================================================
// MAPPER: Response -> Row Supabase (1:1 avec la table SQL)
// =============================================================================

export function toSupabaseRow(
    response: AuditFlashInitResponse,
    rawAddress: string,
    targetDPE: string
): Omit<AuditFlashRow, "updated_at"> {
    const gd = response.goldenData;
    return {
        id: response.auditId,
        raw_address: rawAddress,
        normalized_address: response.normalizedAddress,
        postal_code: response.postalCode,
        city: response.city,
        city_code: response.cityCode,
        latitude: response.coordinates?.latitude ?? null,
        longitude: response.coordinates?.longitude ?? null,
        status: response.status,
        missing_fields: response.missingFields.map((f) => f.field),
        // Golden Data 1
        surface_habitable: gd.surfaceHabitable.value,
        surface_origin: gd.surfaceHabitable.origin,
        surface_source: gd.surfaceHabitable.source,
        surface_confidence: gd.surfaceHabitable.confidence,
        // Golden Data 2
        construction_year: gd.constructionYear.value,
        construction_year_origin: gd.constructionYear.origin,
        construction_year_source: gd.constructionYear.source,
        construction_year_confidence: gd.constructionYear.confidence,
        // Golden Data 3
        dpe_current: gd.dpe.value,
        dpe_origin: gd.dpe.origin,
        dpe_source: gd.dpe.source,
        dpe_numero: gd.dpe.numeroDpe ?? null,
        dpe_date: gd.dpe.dateEtablissement ?? null,
        dpe_conso: gd.dpe.consommation ?? null,
        dpe_ges: gd.dpe.ges ?? null,
        // Golden Data 4
        price_per_sqm: gd.pricePerSqm.value,
        price_origin: gd.pricePerSqm.origin,
        price_source: gd.pricePerSqm.source,
        price_transaction_count: gd.pricePerSqm.transactionCount ?? null,
        price_date_range: gd.pricePerSqm.dateRange ?? null,
        // Enrichment
        number_of_units: response.enrichment.numberOfUnits,
        heating_system: response.enrichment.heatingSystem,
        cadastre_parcel_id: response.enrichment.cadastreParcelId,
        cadastre_surface_terrain: response.enrichment.cadastreSurfaceTerrain,
        target_dpe: targetDPE,
        // Results
        computation: response.computation,
        api_responses: response.apiResponses,
        enrichment_sources: response.sources,
        // Meta
        user_id: null,
        created_at: response.createdAt,
        completed_at: response.status === "COMPLETED" ? response.createdAt : null,
    };
}
