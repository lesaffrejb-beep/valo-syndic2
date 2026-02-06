"use client";

/**
 * Hook React pour l'intégration API DPE ADEME
 * 
 * 🎯 AUDIT CONNECTIVITÉ - Phase 1:
 * Fournit un accès simplifié aux DPE temps réel via l'API ADEME
 * avec gestion d'état (loading, error, data) intégrée
 */

import { useState, useCallback } from "react";
import type { DPELetter } from "@/lib/constants";
import {
    searchDPEByAddress,
    searchDPEByLocation,
    getDPEByNumber,
    calculateDPEStats,
    getPredominantDPE,
    formatDPEResult,
    checkAdemeAPIStatus,
    type AdemeDPEEntry,
    type DPESearchOptions,
    type DPESearchByLocationOptions,
    type DPEStats,
} from "@/lib/api/ademeDpeService";

interface UseAdemeDPEReturn {
    // État
    isLoading: boolean;
    error: string | null;
    results: AdemeDPEEntry[];
    stats: DPEStats | null;
    predominantDPE: DPELetter | null;
    
    // Actions
    searchByAddress: (options: DPESearchOptions) => Promise<void>;
    searchByLocation: (options: DPESearchByLocationOptions) => Promise<void>;
    getByNumber: (dpeNumber: string) => Promise<void>;
    checkAPIStatus: () => Promise<boolean>;
    
    // Utilitaires
    formatResult: (entry: AdemeDPEEntry) => ReturnType<typeof formatDPEResult>;
    reset: () => void;
}

export function useAdemeDPE(): UseAdemeDPEReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<AdemeDPEEntry[]>([]);
    const [stats, setStats] = useState<DPEStats | null>(null);
    const [predominantDPE, setPredominantDPE] = useState<DPELetter | null>(null);

    /**
     * Recherche de DPE par adresse / critères textuels
     */
    const searchByAddress = useCallback(async (options: DPESearchOptions) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await searchDPEByAddress(options);

            if (!response.success) {
                setError(response.error.message);
                setResults([]);
                setStats(null);
                setPredominantDPE(null);
                return;
            }

            const data = response.data;
            setResults(data);
            
            if (data.length > 0) {
                setStats(calculateDPEStats(data));
                setPredominantDPE(getPredominantDPE(data));
            } else {
                setStats(null);
                setPredominantDPE(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setResults([]);
            setStats(null);
            setPredominantDPE(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Recherche de DPE par coordonnées géographiques
     */
    const searchByLocation = useCallback(async (options: DPESearchByLocationOptions) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await searchDPEByLocation(options);

            if (!response.success) {
                setError(response.error.message);
                setResults([]);
                setStats(null);
                setPredominantDPE(null);
                return;
            }

            const data = response.data;
            setResults(data);
            
            if (data.length > 0) {
                setStats(calculateDPEStats(data));
                setPredominantDPE(getPredominantDPE(data));
            } else {
                setStats(null);
                setPredominantDPE(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setResults([]);
            setStats(null);
            setPredominantDPE(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Récupération d'un DPE par son numéro
     */
    const getByNumber = useCallback(async (dpeNumber: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getDPEByNumber(dpeNumber);

            if (!response.success) {
                setError(response.error.message);
                setResults([]);
                setStats(null);
                setPredominantDPE(null);
                return;
            }

            const data = response.data ? [response.data] : [];
            setResults(data);
            
            if (data.length > 0) {
                setStats(calculateDPEStats(data));
                setPredominantDPE(getPredominantDPE(data));
            } else {
                setStats(null);
                setPredominantDPE(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            setResults([]);
            setStats(null);
            setPredominantDPE(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Vérifie si l'API ADEME est accessible
     */
    const checkAPIStatus = useCallback(async (): Promise<boolean> => {
        return await checkAdemeAPIStatus();
    }, []);

    /**
     * Formate un résultat DPE pour affichage
     */
    const formatResult = useCallback((entry: AdemeDPEEntry) => {
        return formatDPEResult(entry);
    }, []);

    /**
     * Réinitialise tous les états
     */
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setResults([]);
        setStats(null);
        setPredominantDPE(null);
    }, []);

    return {
        isLoading,
        error,
        results,
        stats,
        predominantDPE,
        searchByAddress,
        searchByLocation,
        getByNumber,
        checkAPIStatus,
        formatResult,
        reset,
    };
}

export type { AdemeDPEEntry, DPEStats };
