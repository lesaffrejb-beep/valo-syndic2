/**
 * Service API Cadastre (API Carto - IGN)
 * Documentation: https://api.gouv.fr/les-api/api-carto-cadastre
 *
 * API GRATUITE - Pas de clé requise
 * Données cadastrales officielles françaises
 */

import type {
    CadastreParcel,
    CadastreResponse,
    APIResult,
    EnrichmentSource,
    APIError,
} from "./types";

const API_BASE = "https://apicarto.ign.fr/api/cadastre";

interface CadastreSearchResult {
    parcels: CadastreParcel[];
    totalSurface: number;
    mainParcel?: CadastreParcel;
}

/**
 * Recherche les parcelles cadastrales à partir de coordonnées GPS
 * @param lon - Longitude
 * @param lat - Latitude
 */
export async function searchCadastreByCoordinates(
    lon: number,
    lat: number
): Promise<APIResult<CadastreSearchResult>> {
    try {
        // L'API Cadastre utilise un point GeoJSON pour la recherche
        const geom = JSON.stringify({
            type: "Point",
            coordinates: [lon, lat],
        });

        const params = new URLSearchParams({
            geom,
        });

        const response = await fetch(`${API_BASE}/parcelle?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            // L'API peut renvoyer 404 si pas de parcelle trouvée
            if (response.status === 404) {
                return {
                    success: true,
                    data: {
                        parcels: [],
                        totalSurface: 0,
                    },
                    source: {
                        name: "API Cadastre (IGN)",
                        url: "https://cadastre.data.gouv.fr",
                        fetchedAt: new Date(),
                        status: "partial",
                        dataPoints: [],
                    },
                };
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: CadastreResponse = await response.json();
        const parcels = data.features || [];

        // Calculer la surface totale et identifier la parcelle principale
        const totalSurface = parcels.reduce(
            (sum, p) => sum + (p.properties.contenance || 0),
            0
        );

        // La parcelle principale est celle avec la plus grande surface
        const mainParcel = parcels.length > 0
            ? parcels.reduce((max, p) =>
                (p.properties.contenance || 0) > (max.properties.contenance || 0) ? p : max
            )
            : undefined;

        const source: EnrichmentSource = {
            name: "API Cadastre (IGN)",
            url: "https://cadastre.data.gouv.fr",
            fetchedAt: new Date(),
            status: parcels.length > 0 ? "success" : "partial",
            dataPoints: parcels.length > 0
                ? ["parcelle_id", "section", "numero", "surface_terrain"]
                : [],
        };

        return {
            success: true,
            data: {
                parcels,
                totalSurface,
                ...(mainParcel ? { mainParcel } : {}),
            },
            source,
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "CADASTRE_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API Cadastre",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

/**
 * Recherche les parcelles par code commune et références cadastrales
 * @param codeCommune - Code INSEE de la commune
 * @param section - Section cadastrale (optionnel)
 * @param numero - Numéro de parcelle (optionnel)
 */
export async function searchCadastreByReference(
    codeCommune: string,
    section?: string,
    numero?: string
): Promise<APIResult<CadastreSearchResult>> {
    try {
        const params = new URLSearchParams({
            code_insee: codeCommune,
        });

        if (section) params.append("section", section);
        if (numero) params.append("numero", numero);

        const response = await fetch(`${API_BASE}/parcelle?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return {
                    success: true,
                    data: {
                        parcels: [],
                        totalSurface: 0,
                    },
                    source: {
                        name: "API Cadastre (IGN)",
                        url: "https://cadastre.data.gouv.fr",
                        fetchedAt: new Date(),
                        status: "partial",
                        dataPoints: [],
                    },
                };
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: CadastreResponse = await response.json();
        const parcels = data.features || [];

        const totalSurface = parcels.reduce(
            (sum, p) => sum + (p.properties.contenance || 0),
            0
        );

        const mainParcel = parcels.length > 0
            ? parcels.reduce((max, p) =>
                (p.properties.contenance || 0) > (max.properties.contenance || 0) ? p : max
            )
            : undefined;

        const source: EnrichmentSource = {
            name: "API Cadastre (IGN)",
            url: "https://cadastre.data.gouv.fr",
            fetchedAt: new Date(),
            status: parcels.length > 0 ? "success" : "partial",
            dataPoints: parcels.length > 0
                ? ["parcelle_id", "section", "numero", "surface_terrain"]
                : [],
        };

        return {
            success: true,
            data: {
                parcels,
                totalSurface,
                ...(mainParcel ? { mainParcel } : {}),
            },
            source,
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "CADASTRE_REF_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API Cadastre",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

/**
 * Formate les données cadastrales pour l'affichage
 */
export function formatCadastreData(parcel: CadastreParcel): {
    id: string;
    reference: string;
    surface: string;
    commune: string;
} {
    const props = parcel.properties;

    return {
        id: props.id,
        reference: `${props.section} ${props.numero}`,
        surface: props.contenance
            ? `${props.contenance.toLocaleString("fr-FR")} m²`
            : "Non renseignée",
        commune: props.commune,
    };
}

/**
 * Génère un lien vers le cadastre.gouv.fr pour la parcelle
 */
export function getCadastreGeoPortalUrl(parcel: CadastreParcel): string {
    const props = parcel.properties;
    // Lien vers le géoportail du cadastre
    return `https://cadastre.gouv.fr/scpc/rechercherParReferenceCadastrale.do?commune=${props.commune}&section=${props.section}&parcelle=${props.numero}`;
}
