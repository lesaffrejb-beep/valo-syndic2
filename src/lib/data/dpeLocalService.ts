/**
 * Service de données DPE locales (fichier JSON pré-filtré)
 *
 * Charge les données DPE ADEME depuis public/data/dpe-49.json
 * Évite les appels API lourds côté serveur (contrainte Vercel)
 */

import type { EnrichmentSource } from "@/lib/api/types";

// ========================================
// TYPES
// ========================================

export interface DPEEntry {
    n_dpe: string;
    numero_voie?: string;
    nom_rue?: string;
    code_postal: string;
    nom_commune: string;
    etiquette_dpe: string;
    etiquette_ges?: string;
    annee_construction?: number;
    surface_habitable?: number;
    type_batiment?: string;
    date_etablissement_dpe?: string;
    conso_5_usages_ep?: number;
    emission_ges_5_usages?: number;
}

export interface DPEDataset {
    metadata: {
        source: string;
        url: string;
        department: string;
        generatedAt: string;
        count: number;
    };
    data: DPEEntry[];
}

export interface DPESearchResult {
    dpe: DPEEntry | null;
    matchType: "exact" | "street" | "postal" | "none";
    alternatives?: DPEEntry[];
}

// ========================================
// CACHE
// ========================================

let dpeCache: DPEDataset | null = null;
let loadPromise: Promise<DPEDataset | null> | null = null;

// ========================================
// FONCTIONS PRINCIPALES
// ========================================

/**
 * Charge le fichier DPE (lazy load, une seule fois)
 */
async function loadDPEData(): Promise<DPEDataset | null> {
    if (dpeCache) return dpeCache;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            // En environnement client/serveur Next.js
            const response = await fetch("/data/dpe-49.json");
            if (!response.ok) {
                console.warn("[DPE Local] Fichier non trouvé, enrichissement DPE désactivé");
                return null;
            }
            dpeCache = await response.json();

            return dpeCache;
        } catch (error) {
            console.warn("[DPE Local] Erreur chargement:", error);
            return null;
        }
    })();

    return loadPromise;
}

/**
 * Normalise une adresse pour la comparaison
 */
function normalizeAddress(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Enlève accents
        .replace(/[^a-z0-9\s]/g, "")     // Enlève ponctuation
        .replace(/\s+/g, " ")             // Normalise espaces
        .trim();
}

/**
 * Recherche un DPE par adresse
 *
 * Stratégie de recherche:
 * 1. Match exact (numéro + rue + code postal)
 * 2. Match rue (rue + code postal)
 * 3. Match code postal (moyenne du quartier)
 */
export async function searchDPEByAddress(
    address: string,
    postalCode?: string,
    city?: string
): Promise<{
    success: boolean;
    data: DPESearchResult;
    source: EnrichmentSource;
}> {
    const dataset = await loadDPEData();

    const source: EnrichmentSource = {
        name: "DPE ADEME (Local)",
        url: "https://data.ademe.fr",
        fetchedAt: new Date(),
        status: "partial",
        dataPoints: [],
    };

    if (!dataset || dataset.data.length === 0) {
        return {
            success: true,
            data: { dpe: null, matchType: "none" },
            source: { ...source, status: "error" },
        };
    }

    const normalizedAddress = normalizeAddress(address);

    // Extraire numéro et rue de l'adresse
    const numMatch = normalizedAddress.match(/^(\d+)/);
    const numero = numMatch ? numMatch[1] : "";
    const rue = normalizedAddress.replace(/^\d+\s*/, "").trim();

    // 1. Match exact
    const exact = dataset.data.find((dpe) => {
        if (postalCode && dpe.code_postal !== postalCode) return false;
        const dpeNum = dpe.numero_voie || "";
        const dpeRue = normalizeAddress(dpe.nom_rue || "");
        return dpeNum === numero && dpeRue.includes(rue.slice(0, 20));
    });

    if (exact) {
        return {
            success: true,
            data: { dpe: exact, matchType: "exact" },
            source: {
                ...source,
                status: "success",
                dataPoints: ["dpe_officiel", "classe_energie", "annee_construction"],
            },
        };
    }

    // 2. Match rue
    const streetMatches = dataset.data.filter((dpe) => {
        if (postalCode && dpe.code_postal !== postalCode) return false;
        const dpeRue = normalizeAddress(dpe.nom_rue || "");
        return dpeRue.includes(rue.slice(0, 15)) || rue.includes(dpeRue.slice(0, 15));
    });

    if (streetMatches.length > 0) {
        // Prendre le plus récent
        const sorted = streetMatches.sort((a, b) =>
            (b.date_etablissement_dpe || "").localeCompare(a.date_etablissement_dpe || "")
        );
        const firstMatch = sorted[0];
        if (!firstMatch) {
            return {
                success: true,
                data: { dpe: null, matchType: "none" },
                source: { ...source, status: "error" },
            };
        }
        return {
            success: true,
            data: {
                dpe: firstMatch,
                matchType: "street",
                alternatives: sorted.slice(1, 4),
            },
            source: {
                ...source,
                status: "partial",
                dataPoints: ["dpe_rue", "estimation_quartier"],
            },
        };
    }

    // 3. Match code postal (stats moyennes)
    if (postalCode) {
        const postalMatches = dataset.data.filter((dpe) =>
            dpe.code_postal === postalCode
        );

        if (postalMatches.length > 0) {
            // Calculer la distribution des DPE
            const distribution: Record<string, number> = {};
            postalMatches.forEach((dpe) => {
                const classe = dpe.etiquette_dpe || "?";
                distribution[classe] = (distribution[classe] || 0) + 1;
            });

            // DPE le plus fréquent
            const mostCommon = Object.entries(distribution)
                .sort((a, b) => b[1] - a[1])[0];

            if (!mostCommon) {
                return {
                    success: true,
                    data: { dpe: null, matchType: "none" },
                    source: { ...source, status: "error" },
                };
            }

            // Trouver un exemple avec ce DPE
            const example = postalMatches.find((d) => d.etiquette_dpe === mostCommon[0]);

            return {
                success: true,
                data: {
                    dpe: example || null,
                    matchType: "postal",
                    alternatives: postalMatches.slice(0, 3),
                },
                source: {
                    ...source,
                    status: "partial",
                    dataPoints: ["estimation_code_postal", `${postalMatches.length}_dpe_analysés`],
                },
            };
        }
    }

    return {
        success: true,
        data: { dpe: null, matchType: "none" },
        source: { ...source, status: "error", dataPoints: ["aucune_donnee"] },
    };
}

/**
 * Obtenir les statistiques DPE d'un code postal
 */
export async function getDPEStatsByPostalCode(postalCode: string): Promise<{
    averageClass: string;
    distribution: Record<string, number>;
    averageConsumption: number | null;
    averageYear: number | null;
    sampleSize: number;
} | null> {
    const dataset = await loadDPEData();
    if (!dataset) return null;

    const matches = dataset.data.filter((dpe) =>
        dpe.code_postal === postalCode
    );

    if (matches.length === 0) return null;

    // Distribution des classes
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    let totalConso = 0;
    let consoCount = 0;
    let totalYear = 0;
    let yearCount = 0;

    matches.forEach((dpe) => {
        const classe = dpe.etiquette_dpe;
        if (classe && distribution[classe] !== undefined) {
            distribution[classe]++;
        }
        if (dpe.conso_5_usages_ep) {
            totalConso += dpe.conso_5_usages_ep;
            consoCount++;
        }
        if (dpe.annee_construction) {
            totalYear += dpe.annee_construction;
            yearCount++;
        }
    });

    // Classe moyenne pondérée
    const weights: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };
    let weightedSum = 0;
    let weightCount = 0;
    Object.entries(distribution).forEach(([classe, count]) => {
        const weight = weights[classe];
        if (weight !== undefined) {
            weightedSum += weight * count;
            weightCount += count;
        }
    });
    const avgWeight = weightCount > 0 ? weightedSum / weightCount : 4;
    const foundClass = Object.entries(weights).find(([, w]) => w >= avgWeight);
    const avgClass = foundClass ? foundClass[0] : "D";

    return {
        averageClass: avgClass,
        distribution,
        averageConsumption: consoCount > 0 ? Math.round(totalConso / consoCount) : null,
        averageYear: yearCount > 0 ? Math.round(totalYear / yearCount) : null,
        sampleSize: matches.length,
    };
}
