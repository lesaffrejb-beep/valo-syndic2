"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Interface pour les résultats de l'API Adresse Gouv
 */
export interface AddressResult {
    label: string;
    city: string;
    postcode: string;
    street: string;
    housenumber?: string;
    coordinates: {
        lat: number;
        lon: number;
    };
}

/**
 * Interface pour les données DPE trouvées dans Supabase
 */
export interface DPEData {
    numero_dpe: string;
    etiquette_dpe: "A" | "B" | "C" | "D" | "E" | "F" | "G";
    etiquette_ges: "A" | "B" | "C" | "D" | "E" | "F" | "G";
    type_energie: string;
    annee_construction: number | null;
    surface_habitable: number | null;
    conso_kwh_m2_an: number | null;
}

/**
 * Hook useAddressSearch
 * Gère l'autocomplétion d'adresse et la récupération des données DPE associées.
 */
export function useAddressSearch() {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
    const [dpeData, setDpeData] = useState<DPEData | null>(null);
    const [isSearchingDpe, setIsSearchingDpe] = useState(false);

    // Fonction de recherche via l'API Adresse Gouv
    const searchAddress = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
                    searchQuery
                )}&limit=5&type=housenumber`
            );
            const data = await response.json();

            const results: AddressResult[] = data.features.map((feature: any) => ({
                label: feature.properties.label,
                city: feature.properties.city,
                postcode: feature.properties.postcode,
                street: feature.properties.street,
                housenumber: feature.properties.housenumber,
                coordinates: {
                    lon: feature.geometry.coordinates[0],
                    lat: feature.geometry.coordinates[1],
                },
            }));

            setSuggestions(results);
        } catch (error) {
            console.error("Erreur recherche adresse:", error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce simple pour la recherche
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query && !selectedAddress) {
                searchAddress(query);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, searchAddress, selectedAddress]);

    // Fonction pour sélectionner une adresse et chercher le DPE
    const selectAddress = useCallback(async (address: AddressResult) => {
        setSelectedAddress(address);
        setQuery(address.label);
        setSuggestions([]);
        setIsSearchingDpe(true);
        setDpeData(null);

        try {
            // Recherche du DPE dans Supabase via l'adresse normalisée (BAN)
            // On cherche sur la colonne adresse_ban qui contient l'adresse complète
            const { data, error } = await supabase
                .from("reference_dpe")
                .select("*")
                .eq("adresse_ban", address.label)
                .limit(1)
                .single();

            if (error) {
                if (error.code !== "PGRST116") { // PGRST116 = JSON object requested, but no rows returned
                    console.error("Erreur recherche DPE:", error);
                }
            } else if (data) {
                setDpeData(data as DPEData);
            }
        } catch (error) {
            console.error("Erreur fatale recherche DPE:", error);
        } finally {
            setIsSearchingDpe(false);
        }
    }, []);

    const reset = useCallback(() => {
        setQuery("");
        setSelectedAddress(null);
        setDpeData(null);
        setSuggestions([]);
    }, []);

    return {
        query,
        setQuery,
        suggestions,
        isLoading,
        selectedAddress,
        dpeData,
        isSearchingDpe,
        selectAddress,
        reset,
    };
}
