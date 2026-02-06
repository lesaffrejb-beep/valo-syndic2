/**
 * Service API DPE - ADEME (data.ademe.fr)
 * Documentation: https://data.ademe.fr/datasets/dpe-v2-logements-existants
 *
 * API GRATUITE - Pas de clé requise
 * Données DPE des logements existants (tous les DPE valides et historiques)
 *
 * 🎯 AUDIT CONNECTIVITÉ - Phase 1:
 * Remplace le JSON local dpe-49.json par des données temps réel
 * Fallback automatique sur le JSON local si l'API est indisponible
 */

import type { DPELetter } from "@/lib/constants";
import type { APIResult, EnrichmentSource, APIError } from "./types";

const API_BASE = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe-v2-logements-existants";

// =============================================================================
// TYPES
// =============================================================================

export interface AdemeDPEEntry {
    /** Numéro unique du DPE */
    numero_dpe: string;
    /** Adresse complète */
    adresse_brute: string;
    /** Code postal */
    code_postal: string;
    /** Nom de la commune */
    nom_commune: string;
    /** Code INSEE commune */
    code_insee_commune: string;
    /** Coordonnées géographiques (centroïde IRIS) */
    coordonnees: [number, number] | null; // [lon, lat]

    /** Classe énergie (A-G) */
    etiquette_dpe: DPELetter;
    /** Classe GES (A-G) */
    etiquette_ges: string;
    /** Consommation énergie finale (kWh/m²/an) */
    consommation_energie_finale: number;
    /** Émission GES (kg CO2/m²/an) */
    emission_ges: number;
    /** Surface habitable (m²) */
    surface_habitable: number;

    /** Date d'établissement du DPE */
    date_etablissement_dpe: string;
    /** Date de fin de validité */
    date_fin_validite_dpe: string;

    /** Type de bâtiment */
    type_batiment: "appartement" | "maison" | "immeuble";
    /** Période de construction */
    periode_construction?: string | undefined;
    /** Année de construction si disponible */
    annee_construction?: number | undefined;

    /** Type de chauffage */
    type_chauffage?: string | undefined;
    /** Type d'énergie de chauffage */
    energie_chauffage?: string | undefined;
    /** Type d'eau chaude sanitaire */
    type_ecs?: string | undefined;

    /** Si le DPE est encore valide */
    is_valid: boolean;
}

export interface DPESearchOptions {
    /** Limite de résultats (défaut: 5, max: 100) */
    limit?: number | undefined;
    /** Recherche textuelle sur l'adresse */
    query?: string | undefined;
    /** Filtre par code postal */
    codePostal?: string | undefined;
    /** Filtre par code INSEE */
    codeInsee?: string | undefined;
    /** Filtre par classe DPE */
    classeDPE?: DPELetter | undefined;
}

export interface DPESearchByLocationOptions {
    latitude: number;
    longitude: number;
    /** Rayon de recherche en mètres (défaut: 500) */
    radius?: number | undefined;
    /** Limite de résultats (défaut: 10) */
    limit?: number | undefined;
}

export interface DPEStats {
    totalCount: number;
    byClass: Record<DPELetter, number>;
    averageConso: number;
    averageSurface: number;
    newestDPE: string;
    oldestDPE: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Recherche des DPE par critères textuels (adresse, code postal, etc.)
 * @param options - Options de recherche
 */
export async function searchDPEByAddress(
    options: DPESearchOptions
): Promise<APIResult<AdemeDPEEntry[]>> {
    const startTime = Date.now();

    try {
        const params = new URLSearchParams();

        // Limite de résultats
        params.append("size", String(options.limit ?? 5));

        // Recherche textuelle (q param)
        if (options.query) {
            params.append("q", options.query);
        }

        // Filtres additionnels via le paramètre qs (query string avancée)
        const filters: string[] = [];

        if (options.codePostal) {
            filters.push(`code_postal:"${options.codePostal}"`);
        }
        if (options.codeInsee) {
            filters.push(`code_insee_commune:"${options.codeInsee}"`);
        }
        if (options.classeDPE) {
            filters.push(`etiquette_dpe:"${options.classeDPE}"`);
        }

        if (filters.length > 0) {
            params.append("qs", filters.join(" AND "));
        }

        // Tri par date d'établissement (plus récent d'abord)
        params.append("sort", "-date_etablissement_dpe");

        const response = await fetch(`${API_BASE}/lines?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const results: AdemeDPEEntry[] = (data.results || []).map((item: Record<string, unknown>) => ({
            numero_dpe: String(item.numero_dpe || ""),
            adresse_brute: String(item.adresse_brute || ""),
            code_postal: String(item.code_postal || ""),
            nom_commune: String(item.nom_commune || ""),
            code_insee_commune: String(item.code_insee_commune || ""),
            coordonnees: Array.isArray(item.coordonnees)
                ? [Number(item.coordonnees[0]), Number(item.coordonnees[1])]
                : null,
            etiquette_dpe: String(item.etiquette_dpe || "N") as DPELetter,
            etiquette_ges: String(item.etiquette_ges || "N"),
            consommation_energie_finale: Number(item.consommation_energie_finale || 0),
            emission_ges: Number(item.emission_ges || 0),
            surface_habitable: Number(item.surface_habitable || 0),
            date_etablissement_dpe: String(item.date_etablissement_dpe || ""),
            date_fin_validite_dpe: String(item.date_fin_validite_dpe || ""),
            type_batiment: (String(item.type_batiment || "appartement") as AdemeDPEEntry["type_batiment"]),
            periode_construction: item.periode_construction ? String(item.periode_construction) : undefined,
            annee_construction: item.annee_construction ? Number(item.annee_construction) : undefined,
            type_chauffage: item.type_chauffage ? String(item.type_chauffage) : undefined,
            energie_chauffage: item.energie_chauffage ? String(item.energie_chauffage) : undefined,
            type_ecs: item.type_ecs ? String(item.type_ecs) : undefined,
            is_valid: new Date(String(item.date_fin_validite_dpe || "2000-01-01")) > new Date(),
        }));

        const source: EnrichmentSource = {
            name: "API DPE (ADEME)",
            url: "https://data.ademe.fr",
            fetchedAt: new Date(),
            status: results.length > 0 ? "success" : "partial",
            dataPoints: results.length > 0
                ? ["dpe_class", "conso_kwh", "surface", "emission_ges", "date_etablissement"]
                : [],
        };

        return {
            success: true,
            data: results,
            source: {
                ...source,
                // @ts-expect-error - adding debug info
                _debug: {
                    query: options.query,
                    duration: Date.now() - startTime,
                    total: data.total,
                },
            },
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "DPE_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API ADEME DPE",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

/**
 * Recherche des DPE par coordonnées géographiques (geo_distance)
 * @param options - Options de recherche géographique
 */
export async function searchDPEByLocation(
    options: DPESearchByLocationOptions
): Promise<APIResult<AdemeDPEEntry[]>> {
    const startTime = Date.now();

    try {
        const { latitude, longitude, radius = 500, limit = 10 } = options;

        // Construction de la requête geo_distance
        // Format: geo_distance=lon,lat,distance
        const params = new URLSearchParams({
            size: String(limit),
            geo_distance: `${longitude},${latitude},${radius}`,
            sort: "-date_etablissement_dpe",
        });

        const response = await fetch(`${API_BASE}/lines?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const results: AdemeDPEEntry[] = (data.results || []).map((item: Record<string, unknown>) => ({
            numero_dpe: String(item.numero_dpe || ""),
            adresse_brute: String(item.adresse_brute || ""),
            code_postal: String(item.code_postal || ""),
            nom_commune: String(item.nom_commune || ""),
            code_insee_commune: String(item.code_insee_commune || ""),
            coordonnees: Array.isArray(item.coordonnees)
                ? [Number(item.coordonnees[0]), Number(item.coordonnees[1])]
                : null,
            etiquette_dpe: String(item.etiquette_dpe || "N") as DPELetter,
            etiquette_ges: String(item.etiquette_ges || "N"),
            consommation_energie_finale: Number(item.consommation_energie_finale || 0),
            emission_ges: Number(item.emission_ges || 0),
            surface_habitable: Number(item.surface_habitable || 0),
            date_etablissement_dpe: String(item.date_etablissement_dpe || ""),
            date_fin_validite_dpe: String(item.date_fin_validite_dpe || ""),
            type_batiment: (String(item.type_batiment || "appartement") as AdemeDPEEntry["type_batiment"]),
            periode_construction: item.periode_construction ? String(item.periode_construction) : undefined,
            annee_construction: item.annee_construction ? Number(item.annee_construction) : undefined,
            type_chauffage: item.type_chauffage ? String(item.type_chauffage) : undefined,
            energie_chauffage: item.energie_chauffage ? String(item.energie_chauffage) : undefined,
            type_ecs: item.type_ecs ? String(item.type_ecs) : undefined,
            is_valid: new Date(String(item.date_fin_validite_dpe || "2000-01-01")) > new Date(),
        }));

        const source: EnrichmentSource = {
            name: "API DPE (ADEME)",
            url: "https://data.ademe.fr",
            fetchedAt: new Date(),
            status: results.length > 0 ? "success" : "partial",
            dataPoints: results.length > 0
                ? ["dpe_class", "conso_kwh", "surface", "emission_ges", "coordinates"]
                : [],
        };

        return {
            success: true,
            data: results,
            source: {
                ...source,
                // @ts-expect-error - adding debug info
                _debug: {
                    location: { lat: latitude, lon: longitude, radius },
                    duration: Date.now() - startTime,
                    total: data.total,
                },
            },
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "DPE_GEO_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API ADEME DPE",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

/**
 * Récupère un DPE spécifique par son numéro
 * @param dpeNumber - Numéro du DPE
 */
export async function getDPEByNumber(
    dpeNumber: string
): Promise<APIResult<AdemeDPEEntry | null>> {
    try {
        const params = new URLSearchParams({
            qs: `numero_dpe:"${dpeNumber}"`,
            size: "1",
        });

        const response = await fetch(`${API_BASE}/lines?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const item = data.results?.[0];

        if (!item) {
            return {
                success: true,
                data: null,
                source: {
                    name: "API DPE (ADEME)",
                    url: "https://data.ademe.fr",
                    fetchedAt: new Date(),
                    status: "partial",
                    dataPoints: [],
                },
            };
        }

        const result: AdemeDPEEntry = {
            numero_dpe: String(item.numero_dpe || ""),
            adresse_brute: String(item.adresse_brute || ""),
            code_postal: String(item.code_postal || ""),
            nom_commune: String(item.nom_commune || ""),
            code_insee_commune: String(item.code_insee_commune || ""),
            coordonnees: Array.isArray(item.coordonnees)
                ? [Number(item.coordonnees[0]), Number(item.coordonnees[1])]
                : null,
            etiquette_dpe: String(item.etiquette_dpe || "N") as DPELetter,
            etiquette_ges: String(item.etiquette_ges || "N"),
            consommation_energie_finale: Number(item.consommation_energie_finale || 0),
            emission_ges: Number(item.emission_ges || 0),
            surface_habitable: Number(item.surface_habitable || 0),
            date_etablissement_dpe: String(item.date_etablissement_dpe || ""),
            date_fin_validite_dpe: String(item.date_fin_validite_dpe || ""),
            type_batiment: (String(item.type_batiment || "appartement") as AdemeDPEEntry["type_batiment"]),
            periode_construction: item.periode_construction ? String(item.periode_construction) : undefined,
            annee_construction: item.annee_construction ? Number(item.annee_construction) : undefined,
            type_chauffage: item.type_chauffage ? String(item.type_chauffage) : undefined,
            energie_chauffage: item.energie_chauffage ? String(item.energie_chauffage) : undefined,
            type_ecs: item.type_ecs ? String(item.type_ecs) : undefined,
            is_valid: new Date(String(item.date_fin_validite_dpe || "2000-01-01")) > new Date(),
        };

        return {
            success: true,
            data: result,
            source: {
                name: "API DPE (ADEME)",
                url: "https://data.ademe.fr",
                fetchedAt: new Date(),
                status: "success",
                dataPoints: ["dpe_class", "conso_kwh", "surface", "emission_ges"],
            },
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "DPE_GET_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API ADEME DPE",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Calcule les statistiques DPE à partir d'une liste de DPE
 */
export function calculateDPEStats(entries: AdemeDPEEntry[]): DPEStats {
    if (entries.length === 0) {
        return {
            totalCount: 0,
            byClass: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 },
            averageConso: 0,
            averageSurface: 0,
            newestDPE: "",
            oldestDPE: "",
        };
    }

    const byClass: Record<DPELetter, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    let totalConso = 0;
    let totalSurface = 0;

    const dates = entries
        .map(e => e.date_etablissement_dpe)
        .filter(Boolean)
        .sort();

    entries.forEach(entry => {
        if (entry.etiquette_dpe in byClass) {
            byClass[entry.etiquette_dpe]++;
        }
        totalConso += entry.consommation_energie_finale || 0;
        totalSurface += entry.surface_habitable || 0;
    });

    return {
        totalCount: entries.length,
        byClass,
        averageConso: Math.round(totalConso / entries.length),
        averageSurface: Math.round(totalSurface / entries.length),
        newestDPE: dates[dates.length - 1] || "",
        oldestDPE: dates[0] || "",
    };
}

/**
 * Détermine le DPE prédominant (le plus fréquent) dans une liste
 */
export function getPredominantDPE(entries: AdemeDPEEntry[]): DPELetter | null {
    if (entries.length === 0) return null;

    const stats = calculateDPEStats(entries);
    let maxCount = 0;
    let predominant: DPELetter | null = null;

    (Object.keys(stats.byClass) as DPELetter[]).forEach(letter => {
        if (stats.byClass[letter] > maxCount) {
            maxCount = stats.byClass[letter];
            predominant = letter;
        }
    });

    return predominant;
}

/**
 * Formate les données DPE pour affichage
 */
export function formatDPEResult(entry: AdemeDPEEntry): {
    label: string;
    dpeClass: string;
    conso: string;
    surface: string;
    date: string;
    valid: string;
} {
    return {
        label: entry.adresse_brute,
        dpeClass: entry.etiquette_dpe,
        conso: `${Math.round(entry.consommation_energie_finale)} kWh/m²/an`,
        surface: `${Math.round(entry.surface_habitable)} m²`,
        date: new Date(entry.date_etablissement_dpe).toLocaleDateString("fr-FR"),
        valid: entry.is_valid ? "✓ Valide" : "✗ Expiré",
    };
}

/**
 * Vérifie si l'API ADEME est accessible
 */
export async function checkAdemeAPIStatus(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/lines?size=1`, {
            method: "GET",
            headers: { "Accept": "application/json" },
        });
        return response.ok;
    } catch {
        return false;
    }
}
