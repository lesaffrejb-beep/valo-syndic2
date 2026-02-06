/**
 * Service API Adresse (BAN - Base Adresse Nationale)
 * Documentation: https://adresse.data.gouv.fr/api-doc/adresse
 *
 * API GRATUITE - Pas de clé requise
 * Limite: 50 requêtes/seconde/IP
 */

import type {
    AddressFeature,
    AddressSearchResponse,
    APIResult,
    EnrichmentSource,
    APIError,
} from "./types";

const API_BASE = "https://api-adresse.data.gouv.fr";

/**
 * Recherche d'adresses avec auto-complétion
 * @param query - Texte de recherche (ex: "12 rue de la paix angers")
 * @param options - Options de filtrage
 */
export interface AddressSearchOptions {
    limit?: number;           // Nombre de résultats (défaut: 5, max: 100)
    postcode?: string;        // Filtrer par code postal
    citycode?: string;        // Filtrer par code INSEE
    type?: "housenumber" | "street" | "locality" | "municipality";
    autocomplete?: boolean;   // Mode auto-complétion (défaut: true)
}

export async function searchAddress(
    query: string,
    options?: AddressSearchOptions
): Promise<APIResult<AddressFeature[]>> {
    const startTime = Date.now();

    try {
        const params = new URLSearchParams({
            q: query,
            limit: String(options?.limit ?? 5),
            autocomplete: String(options?.autocomplete ?? 1),
        });

        if (options?.postcode) params.append("postcode", options.postcode);
        if (options?.citycode) params.append("citycode", options.citycode);
        if (options?.type) params.append("type", options.type);

        const response = await fetch(`${API_BASE}/search/?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: AddressSearchResponse = await response.json();

        const source: EnrichmentSource = {
            name: "API Adresse (BAN)",
            url: "https://adresse.data.gouv.fr",
            fetchedAt: new Date(),
            status: data.features.length > 0 ? "success" : "partial",
            dataPoints: data.features.length > 0
                ? ["adresse", "coordonnees", "code_postal", "ville", "code_insee"]
                : [],
        };

        return {
            success: true,
            data: data.features,
            source,
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "ADDRESS_SEARCH_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API Adresse",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

/**
 * Géocodage inverse - Coordonnées → Adresse
 * @param lon - Longitude
 * @param lat - Latitude
 */
export async function reverseGeocode(
    lon: number,
    lat: number
): Promise<APIResult<AddressFeature | null>> {
    try {
        const params = new URLSearchParams({
            lon: String(lon),
            lat: String(lat),
        });

        const response = await fetch(`${API_BASE}/reverse/?${params}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: AddressSearchResponse = await response.json();

        const source: EnrichmentSource = {
            name: "API Adresse (BAN)",
            url: "https://adresse.data.gouv.fr",
            fetchedAt: new Date(),
            status: data.features.length > 0 ? "success" : "partial",
            dataPoints: data.features.length > 0 ? ["adresse_inverse"] : [],
        };

        return {
            success: true,
            data: data.features[0] || null,
            source,
        };
    } catch (error) {
        const apiError: APIError = {
            name: "APIError",
            code: "REVERSE_GEOCODE_FAILED",
            message: error instanceof Error ? error.message : "Erreur inconnue",
            source: "API Adresse",
        };

        return {
            success: false,
            error: apiError,
        };
    }
}

/**
 * Normalise une adresse en la recherchant et en prenant le meilleur résultat
 * Utile pour corriger les fautes de frappe et compléter les infos
 */
export async function normalizeAddress(
    address: string,
    postalCode?: string
): Promise<APIResult<AddressFeature | null>> {
    const options: AddressSearchOptions = {
        limit: 1,
        type: "housenumber",
        autocomplete: false,
    };
    if (postalCode) options.postcode = postalCode;

    const result = await searchAddress(address, options);

    if (!result.success) {
        return result;
    }

    return {
        success: true,
        data: result.data[0] || null,
        source: result.source,
    };
}

/**
 * Extrait les données utiles d'une AddressFeature
 */
export function extractAddressData(feature: AddressFeature) {
    return {
        fullAddress: feature.properties.label,
        houseNumber: feature.properties.housenumber,
        street: feature.properties.street || feature.properties.name,
        postalCode: feature.properties.postcode,
        city: feature.properties.city,
        cityCode: feature.properties.citycode,
        context: feature.properties.context,
        coordinates: {
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
        },
        confidence: feature.properties.score,
    };
}
