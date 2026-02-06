/**
 * API Services - Point d'entrée central
 *
 * Ce module orchestre les appels aux APIs gouvernementales françaises
 * pour enrichir automatiquement les données des copropriétés.
 *
 * APIs utilisées (toutes GRATUITES, sans clé) :
 * - API Adresse (BAN) : Auto-complétion et géocodage
 * - API Cadastre (IGN) : Données parcellaires
 * - API DVF (Etalab) : Prix immobiliers
 */

// Re-exports des services
export * from "./types";
export * from "./addressService";
export * from "./cadastreService";
export * from "./dvfService";
export * from "./ademeDpeService";
export * from "./settingsService";
export * from "./rnicService";

import {
    searchAddress,
    normalizeAddress,
    extractAddressData,
    type AddressSearchOptions,
} from "./addressService";

import {
    searchCadastreByCoordinates,
    formatCadastreData,
} from "./cadastreService";

import {
    searchDVFByLocation,
    calculateDVFStats,
} from "./dvfService";

import type { AddressFeature, EnrichedProperty, EnrichmentSource } from "./types";

/**
 * Enrichit une propriété avec toutes les données disponibles
 * Orchestration centralisée des appels API
 *
 * @param address - Adresse saisie par l'utilisateur
 * @param postalCode - Code postal (optionnel, améliore la précision)
 * @param options - Options d'enrichissement
 */
export async function enrichProperty(
    address: string,
    postalCode?: string,
    options?: {
        includeCadastre?: boolean;  // Défaut: true
        includeDVF?: boolean;       // Défaut: true
        dvfRadius?: number;         // Rayon DVF en mètres (défaut: 500)
        dvfYearsBack?: number;      // Années de données DVF (défaut: 3)
    }
): Promise<{
    property: Partial<EnrichedProperty>;
    sources: EnrichmentSource[];
    errors: string[];
}> {
    const sources: EnrichmentSource[] = [];
    const errors: string[] = [];
    const property: Partial<EnrichedProperty> = {
        address,
        enrichmentSources: [],
    };

    const opts = {
        includeCadastre: true,
        includeDVF: true,
        dvfRadius: 500,
        dvfYearsBack: 3,
        ...options,
    };

    // ========================================
    // ÉTAPE 1: Normalisation de l'adresse (API Adresse)
    // ========================================
    const addressResult = await normalizeAddress(address, postalCode);

    if (addressResult.success && addressResult.data) {
        const extracted = extractAddressData(addressResult.data);

        property.address = extracted.fullAddress;
        property.postalCode = extracted.postalCode;
        property.city = extracted.city;
        property.cityCode = extracted.cityCode;
        property.context = extracted.context;
        property.coordinates = extracted.coordinates;

        sources.push(addressResult.source);
    } else {
        errors.push("Adresse non trouvée dans la base nationale");
        // On continue quand même avec les données saisies
        if (postalCode) property.postalCode = postalCode;
    }

    // ========================================
    // ÉTAPE 2: Données cadastrales (API Cadastre)
    // ========================================
    if (opts.includeCadastre && property.coordinates) {
        const cadastreResult = await searchCadastreByCoordinates(
            property.coordinates.longitude,
            property.coordinates.latitude
        );

        if (cadastreResult.success && cadastreResult.data.mainParcel) {
            const parcel = cadastreResult.data.mainParcel;
            const formatted = formatCadastreData(parcel);

            property.cadastre = {
                parcelId: formatted.id,
                section: parcel.properties.section,
                numero: parcel.properties.numero,
                surface: parcel.properties.contenance || 0,
                fetchedAt: new Date(),
            };

            sources.push(cadastreResult.source);
        } else if (cadastreResult.success) {
            sources.push({
                ...cadastreResult.source,
                status: "partial",
            });
        } else {
            errors.push("Données cadastrales non disponibles pour cette adresse");
        }
    }

    // ========================================
    // ÉTAPE 3: Prix immobiliers (API DVF)
    // ========================================
    if (opts.includeDVF && property.coordinates) {
        const dvfResult = await searchDVFByLocation(
            property.coordinates.latitude,
            property.coordinates.longitude,
            {
                distanceMax: opts.dvfRadius,
                typeLocal: "Appartement", // Focus copropriétés
            }
        );

        if (dvfResult.success && dvfResult.data.length > 0) {
            const stats = calculateDVFStats(dvfResult.data, {
                typeLocal: "Appartement",
                yearsBack: opts.dvfYearsBack,
            });

            if (stats) {
                property.marketData = {
                    averagePricePerSqm: stats.averagePricePerSqm,
                    transactionCount: stats.transactionCount,
                    priceRange: stats.priceRange,
                    lastTransactionDate: stats.lastTransactionDate,
                    fetchedAt: new Date(),
                };

                sources.push(dvfResult.source);
            } else {
                sources.push({
                    ...dvfResult.source,
                    status: "partial",
                    dataPoints: ["donnees_insuffisantes"],
                });
            }
        } else if (dvfResult.success) {
            sources.push({
                ...dvfResult.source,
                status: "partial",
            });
            errors.push("Pas de transactions immobilières récentes dans ce secteur");
        } else {
            errors.push("Données de prix non disponibles");
        }
    }

    // Stocker les sources dans la propriété
    property.enrichmentSources = sources;

    return {
        property,
        sources,
        errors,
    };
}

/**
 * Version légère pour l'auto-complétion uniquement
 * Utilisée dans le champ de saisie d'adresse
 */
export async function autocompleteAddress(
    query: string,
    options?: {
        limit?: number;
        postcode?: string;
    }
): Promise<{
    suggestions: Array<{
        label: string;
        value: AddressFeature;
    }>;
}> {
    if (query.length < 3) {
        return { suggestions: [] };
    }

    const searchOptions: AddressSearchOptions = {
        limit: options?.limit ?? 5,
        autocomplete: true,
    };
    if (options?.postcode) searchOptions.postcode = options.postcode;

    const result = await searchAddress(query, searchOptions);

    if (!result.success) {
        return { suggestions: [] };
    }

    return {
        suggestions: result.data.map((feature) => ({
            label: feature.properties.label,
            value: feature,
        })),
    };
}

/**
 * Vérifie si les APIs sont accessibles
 * Utile pour le debugging et le status
 */
export async function checkAPIStatus(): Promise<{
    address: boolean;
    cadastre: boolean;
    dvf: boolean;
}> {
    const results = await Promise.allSettled([
        fetch("https://api-adresse.data.gouv.fr/search/?q=test&limit=1"),
        fetch("https://apicarto.ign.fr/api/cadastre/parcelle?code_insee=75056"),
        fetch("https://api.dvf.etalab.gouv.fr/mutations?code_commune=75056"),
    ]);

    return {
        address: results[0].status === "fulfilled" && results[0].value.ok,
        cadastre: results[1].status === "fulfilled" && (results[1].value.ok || results[1].value.status === 404),
        dvf: results[2].status === "fulfilled" && results[2].value.ok,
    };
}
