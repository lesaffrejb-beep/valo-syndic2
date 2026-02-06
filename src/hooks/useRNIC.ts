"use client";

/**
 * Hook React pour l'intégration RNIC (Registre National des Copropriétés)
 * 
 * 🎯 AUDIT CONNECTIVITÉ - Phase 3:
 * Permet de récupérer automatiquement les données des copropriétés
 */

import { useState, useCallback } from "react";
import {
    enrichCoproperty,
    searchCoproperty,
    getCopropertyById,
    estimateNumberOfUnits,
    checkRNICStatus,
    type CopropertyData,
    type RNICEnrichmentResult,
    type RNICSearchOptions,
} from "@/lib/api/rnicService";

interface UseRNICReturn {
    // État
    isLoading: boolean;
    error: string | null;
    coproperty: CopropertyData | null;
    suggestions: CopropertyData[];
    
    // Actions
    search: (address: string, options?: RNICSearchOptions) => Promise<void>;
    getById: (id: string) => Promise<void>;
    enrich: (address: string, options?: RNICSearchOptions) => Promise<void>;
    
    // Utilitaires
    estimateUnits: (totalSurface: number, averageUnitSize?: number) => { estimated: number; confidence: "low" | "medium" | "high" };
    checkStatus: () => Promise<{ supabase: boolean; apiEntreprise: boolean; sirene: boolean }>;
    reset: () => void;
}

export function useRNIC(): UseRNICReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [coproperty, setCoproperty] = useState<CopropertyData | null>(null);
    const [suggestions, setSuggestions] = useState<CopropertyData[]>([]);

    /**
     * Recherche de copropriétés
     */
    const search = useCallback(async (address: string, options?: RNICSearchOptions) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await searchCoproperty(address);

            if (!result.success) {
                setError(result.error.message);
                setCoproperty(null);
                setSuggestions([]);
                return;
            }

            setSuggestions(result.data);
            setCoproperty(result.data[0] || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setCoproperty(null);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Récupère une copropriété par ID
     */
    const getById = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getCopropertyById(id);

            if (!result.success) {
                setError(result.error.message);
                setCoproperty(null);
                return;
            }

            setCoproperty(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setCoproperty(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Enrichissement complet d'une adresse
     */
    const enrich = useCallback(async (address: string, options?: RNICSearchOptions) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await enrichCoproperty(address, options);

            setCoproperty(result.coproperty);
            setSuggestions(result.suggestions);
            
            if (result.errors.length > 0 && !result.coproperty) {
                setError(result.errors.join("; "));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setCoproperty(null);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Estime le nombre de lots
     */
    const estimateUnits = useCallback((totalSurface: number, averageUnitSize?: number) => {
        return estimateNumberOfUnits(totalSurface, averageUnitSize);
    }, []);

    /**
     * Vérifie le statut des sources
     */
    const checkStatus = useCallback(async () => {
        return await checkRNICStatus();
    }, []);

    /**
     * Réinitialise l'état
     */
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setCoproperty(null);
        setSuggestions([]);
    }, []);

    return {
        isLoading,
        error,
        coproperty,
        suggestions,
        search,
        getById,
        enrich,
        estimateUnits,
        checkStatus,
        reset,
    };
}

export type { CopropertyData, RNICEnrichmentResult };
