/**
 * Service de données BDNB locales (fichier JSON pré-filtré)
 *
 * Charge les données BDNB depuis public/data/bdnb-49.json
 * Indexé par parcelle cadastrale pour jointure avec API Cadastre
 */

import type { EnrichmentSource } from "@/lib/api/types";

// ========================================
// TYPES
// ========================================

export interface BDNBBuilding {
    batiment_groupe_id: string;
    code_postal?: string;
    libelle_commune?: string;
    annee_construction?: number;
    mat_mur_txt?: string;
    mat_toit_txt?: string;
    nb_log?: number;
    hauteur_mean?: number;
    s_geom_groupe?: number;
    l_parcelle?: string;
    dpe_mix_arrete_initial?: string;
}

export interface BDNBDataset {
    metadata: {
        source: string;
        url: string;
        department: string;
        generatedAt: string;
        buildingCount: number;
        parcelCount: number;
        status?: string;
    };
    byParcel: Record<string, BDNBBuilding[]>;
    byPostalCode: Record<string, BDNBBuilding[]>;
}

export interface BDNBSearchResult {
    building: BDNBBuilding | null;
    matchType: "parcel" | "postal" | "none";
    confidence: "high" | "medium" | "low";
}

// ========================================
// CACHE
// ========================================

let bdnbCache: BDNBDataset | null = null;
let loadPromise: Promise<BDNBDataset | null> | null = null;

// ========================================
// FONCTIONS PRINCIPALES
// ========================================

/**
 * Charge le fichier BDNB (lazy load)
 */
async function loadBDNBData(): Promise<BDNBDataset | null> {
    if (bdnbCache) return bdnbCache;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            const response = await fetch("/data/bdnb-49.json");
            if (!response.ok) {
                console.warn("[BDNB Local] Fichier non trouvé, enrichissement BDNB désactivé");
                return null;
            }
            bdnbCache = await response.json();

            // Vérifier si les données sont valides
            if (bdnbCache?.metadata?.status === "MANUAL_IMPORT_REQUIRED") {
                console.warn("[BDNB Local] Import manuel requis");
                return null;
            }


            return bdnbCache;
        } catch (error) {
            console.warn("[BDNB Local] Erreur chargement:", error);
            return null;
        }
    })();

    return loadPromise;
}

/**
 * Recherche un bâtiment par ID de parcelle cadastrale
 *
 * @param parcelId - ID de parcelle (format Cadastre: commune+section+numero)
 */
export async function searchBDNBByParcel(
    parcelId: string
): Promise<{
    success: boolean;
    data: BDNBSearchResult;
    source: EnrichmentSource;
}> {
    const dataset = await loadBDNBData();

    const source: EnrichmentSource = {
        name: "BDNB (CSTB)",
        url: "https://bdnb.io",
        fetchedAt: new Date(),
        status: "partial",
        dataPoints: [],
    };

    if (!dataset) {
        return {
            success: true,
            data: { building: null, matchType: "none", confidence: "low" },
            source: { ...source, status: "error" },
        };
    }

    // Recherche par parcelle
    const buildings = dataset.byParcel[parcelId];

    if (buildings && buildings.length > 0) {
        // Si plusieurs bâtiments, prendre le plus grand
        const sorted = buildings.sort((a, b) =>
            (b.s_geom_groupe || 0) - (a.s_geom_groupe || 0)
        );

        const firstBuilding = sorted[0];
        if (!firstBuilding) {
            return {
                success: true,
                data: { building: null, matchType: "none", confidence: "low" },
                source: { ...source, status: "error" },
            };
        }

        return {
            success: true,
            data: {
                building: firstBuilding,
                matchType: "parcel",
                confidence: "high",
            },
            source: {
                ...source,
                status: "success",
                dataPoints: ["annee_construction", "materiaux", "surface_sol"],
            },
        };
    }

    return {
        success: true,
        data: { building: null, matchType: "none", confidence: "low" },
        source: { ...source, status: "error", dataPoints: ["aucune_donnee"] },
    };
}

/**
 * Recherche un bâtiment par code postal et caractéristiques
 * (Fallback quand la parcelle n'est pas trouvée)
 */
export async function searchBDNBByPostalCode(
    postalCode: string,
    options?: {
        nbLogements?: number;
        surfaceApprox?: number;
    }
): Promise<{
    success: boolean;
    data: BDNBSearchResult;
    source: EnrichmentSource;
}> {
    const dataset = await loadBDNBData();

    const source: EnrichmentSource = {
        name: "BDNB (CSTB)",
        url: "https://bdnb.io",
        fetchedAt: new Date(),
        status: "partial",
        dataPoints: [],
    };

    if (!dataset) {
        return {
            success: true,
            data: { building: null, matchType: "none", confidence: "low" },
            source: { ...source, status: "error" },
        };
    }

    const buildings = dataset.byPostalCode[postalCode];

    if (!buildings || buildings.length === 0) {
        return {
            success: true,
            data: { building: null, matchType: "none", confidence: "low" },
            source: { ...source, status: "error", dataPoints: ["aucune_donnee"] },
        };
    }

    // Si on a des critères de filtrage
    if (options?.nbLogements || options?.surfaceApprox) {
        const filtered = buildings.filter((b) => {
            if (options.nbLogements && b.nb_log) {
                // Tolérance de 20%
                const diff = Math.abs(b.nb_log - options.nbLogements) / options.nbLogements;
                if (diff > 0.2) return false;
            }
            if (options.surfaceApprox && b.s_geom_groupe) {
                const diff = Math.abs(b.s_geom_groupe - options.surfaceApprox) / options.surfaceApprox;
                if (diff > 0.3) return false;
            }
            return true;
        });

        const firstFiltered = filtered[0];
        if (firstFiltered) {
            return {
                success: true,
                data: {
                    building: firstFiltered,
                    matchType: "postal",
                    confidence: "medium",
                },
                source: {
                    ...source,
                    status: "partial",
                    dataPoints: ["estimation_code_postal"],
                },
            };
        }
    }

    // Retourner le bâtiment le plus représentatif (le plus grand)
    const sorted = buildings.sort((a, b) =>
        (b.nb_log || 0) - (a.nb_log || 0)
    );

    const firstSorted = sorted[0];
    if (!firstSorted) {
        return {
            success: true,
            data: { building: null, matchType: "none", confidence: "low" },
            source: { ...source, status: "error" },
        };
    }

    return {
        success: true,
        data: {
            building: firstSorted,
            matchType: "postal",
            confidence: "low",
        },
        source: {
            ...source,
            status: "partial",
            dataPoints: ["estimation_quartier"],
        },
    };
}

/**
 * Obtenir les statistiques BDNB d'un code postal
 */
export async function getBDNBStatsByPostalCode(postalCode: string): Promise<{
    averageYear: number | null;
    yearRange: { min: number; max: number } | null;
    dominantMaterial: string | null;
    averageLogements: number | null;
    sampleSize: number;
} | null> {
    const dataset = await loadBDNBData();
    if (!dataset) return null;

    const buildings = dataset.byPostalCode[postalCode];
    if (!buildings || buildings.length === 0) return null;

    // Calculs statistiques
    const years = buildings
        .map((b) => b.annee_construction)
        .filter((y): y is number => y !== undefined && y !== null && y > 1500);

    const materials: Record<string, number> = {};
    buildings.forEach((b) => {
        if (b.mat_mur_txt) {
            materials[b.mat_mur_txt] = (materials[b.mat_mur_txt] || 0) + 1;
        }
    });

    const logCounts = buildings
        .map((b) => b.nb_log)
        .filter((n): n is number => n !== undefined && n !== null);

    return {
        averageYear: years.length > 0
            ? Math.round(years.reduce((a, b) => a + b, 0) / years.length)
            : null,
        yearRange: years.length > 0
            ? { min: Math.min(...years), max: Math.max(...years) }
            : null,
        dominantMaterial: Object.entries(materials).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        averageLogements: logCounts.length > 0
            ? Math.round(logCounts.reduce((a, b) => a + b, 0) / logCounts.length)
            : null,
        sampleSize: buildings.length,
    };
}

/**
 * Formate les informations BDNB pour l'affichage
 */
export function formatBDNBInfo(building: BDNBBuilding): {
    anneeConstruction: string;
    materiaux: string;
    typologie: string;
} {
    return {
        anneeConstruction: building.annee_construction
            ? `${building.annee_construction}`
            : "Non renseignée",
        materiaux: building.mat_mur_txt || "Non renseigné",
        typologie: building.nb_log
            ? `${building.nb_log} logements`
            : "Inconnu",
    };
}
