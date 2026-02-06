"use client";

import { useState, useCallback } from "react";
import {
    enrichProperty,
    autocompleteAddress,
    type EnrichedProperty,
    type EnrichmentSource,
    type AddressFeature,
} from "@/lib/api";

interface UsePropertyEnrichmentReturn {
    // État
    isLoading: boolean;
    isEnriching: boolean;
    property: Partial<EnrichedProperty> | null;
    sources: EnrichmentSource[];
    errors: string[];

    // Auto-complétion
    suggestions: Array<{ label: string; value: AddressFeature }>;
    searchAddress: (query: string) => Promise<void>;
    selectAddress: (feature: AddressFeature) => void;
    clearSuggestions: () => void;

    // Enrichissement complet
    enrichFromAddress: (address: string, postalCode?: string) => Promise<void>;

    // Reset
    reset: () => void;
}

/**
 * Hook pour l'enrichissement automatique des propriétés
 *
 * Usage:
 * ```tsx
 * const {
 *   suggestions,
 *   searchAddress,
 *   selectAddress,
 *   property,
 *   sources,
 *   isEnriching
 * } = usePropertyEnrichment();
 *
 * // Dans le champ d'adresse
 * <input onChange={(e) => searchAddress(e.target.value)} />
 *
 * // Afficher les suggestions
 * {suggestions.map(s => (
 *   <button onClick={() => selectAddress(s.value)}>{s.label}</button>
 * ))}
 *
 * // Après sélection, property contient les données enrichies
 * {property?.marketData && (
 *   <p>Prix moyen: {property.marketData.averagePricePerSqm} €/m²</p>
 * )}
 * ```
 */
export function usePropertyEnrichment(): UsePropertyEnrichmentReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [property, setProperty] = useState<Partial<EnrichedProperty> | null>(null);
    const [sources, setSources] = useState<EnrichmentSource[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<Array<{ label: string; value: AddressFeature }>>([]);

    // Debounce timer ref
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    /**
     * Recherche d'adresses avec debounce
     */
    const searchAddress = useCallback(async (query: string) => {
        // Clear previous timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        // Ne pas chercher si moins de 3 caractères
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        // Debounce de 300ms
        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const result = await autocompleteAddress(query, { limit: 6 });
                setSuggestions(result.suggestions);
            } catch (error) {
                console.error("Erreur auto-complétion:", error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        setDebounceTimer(timer);
    }, [debounceTimer]);

    /**
     * Sélection d'une adresse et enrichissement automatique
     */
    const selectAddress = useCallback(async (feature: AddressFeature) => {
        setSuggestions([]);
        setIsEnriching(true);
        setErrors([]);

        try {
            const result = await enrichProperty(
                feature.properties.label,
                feature.properties.postcode,
                {
                    includeCadastre: true,
                    includeDVF: true,
                    dvfRadius: 500,
                    dvfYearsBack: 3,
                }
            );

            setProperty(result.property);
            setSources(result.sources);
            setErrors(result.errors);
        } catch (error) {
            console.error("Erreur enrichissement:", error);
            setErrors(["Erreur lors de l'enrichissement des données"]);
        } finally {
            setIsEnriching(false);
        }
    }, []);

    /**
     * Enrichissement depuis une adresse texte
     */
    const enrichFromAddress = useCallback(async (address: string, postalCode?: string) => {
        setIsEnriching(true);
        setErrors([]);

        try {
            const result = await enrichProperty(address, postalCode, {
                includeCadastre: true,
                includeDVF: true,
                dvfRadius: 500,
                dvfYearsBack: 3,
            });

            setProperty(result.property);
            setSources(result.sources);
            setErrors(result.errors);
        } catch (error) {
            console.error("Erreur enrichissement:", error);
            setErrors(["Erreur lors de l'enrichissement des données"]);
        } finally {
            setIsEnriching(false);
        }
    }, []);

    /**
     * Clear suggestions
     */
    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
    }, []);

    /**
     * Reset complet
     */
    const reset = useCallback(() => {
        setIsLoading(false);
        setIsEnriching(false);
        setProperty(null);
        setSources([]);
        setErrors([]);
        setSuggestions([]);
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
    }, [debounceTimer]);

    return {
        isLoading,
        isEnriching,
        property,
        sources,
        errors,
        suggestions,
        searchAddress,
        selectAddress,
        clearSuggestions,
        enrichFromAddress,
        reset,
    };
}
