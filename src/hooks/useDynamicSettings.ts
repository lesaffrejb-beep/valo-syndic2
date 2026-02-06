"use client";

/**
 * Hook React pour les paramètres dynamiques Supabase
 * 
 * 🎯 AUDIT CONNECTIVITÉ - Phase 2:
 * Permet d'accéder aux constantes métier depuis Supabase
 * avec gestion d'état (loading, error, data)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    getDynamicConstants,
    getBT01Data,
    getPricingData,
    getSetting,
    invalidateSettingsCache,
    isSupabaseConfigured,
    getFallbackConstants,
    type DynamicConstants,
    type Setting,
    type BT01Data,
} from "@/lib/api/settingsService";

interface UseDynamicSettingsReturn {
    // État
    isLoading: boolean;
    error: string | null;
    isConfigured: boolean;
    
    // Données
    constants: DynamicConstants;
    bt01Data: BT01Data | null;
    
    // Actions
    refresh: () => Promise<void>;
    getSetting: (key: string) => Promise<Setting | null>;
    invalidateCache: () => void;
}

/**
 * Hook pour accéder aux paramètres dynamiques Supabase
 * 
 * Usage:
 * ```tsx
 * const { constants, isLoading, bt01Data } = useDynamicSettings();
 * 
 * if (!isLoading) {
 *   console.log(`Inflation BT01: ${bt01Data?.display}`);
 *   console.log(`Prix m²: ${constants.basePricePerSqm}€`);
 * }
 * ```
 */
export function useDynamicSettings(): UseDynamicSettingsReturn {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [constants, setConstants] = useState<DynamicConstants>(getFallbackConstants());
    const [bt01Data, setBt01Data] = useState<BT01Data | null>(null);
    
    const isConfigured = useMemo(() => isSupabaseConfigured(), []);

    /**
     * Charge les paramètres depuis Supabase
     */
    const loadSettings = useCallback(async () => {
        if (!isConfigured) {
            setIsLoading(false);
            setError("Supabase non configuré - utilisation des valeurs par défaut");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [dynamicConstants, bt01] = await Promise.all([
                getDynamicConstants(),
                getBT01Data(),
            ]);

            setConstants(dynamicConstants);
            setBt01Data(bt01);
        } catch (err) {
            console.error("Failed to load dynamic settings:", err);
            setError(err instanceof Error ? err.message : "Erreur de chargement");
            // Fallback sur les valeurs par défaut
            setConstants(getFallbackConstants());
        } finally {
            setIsLoading(false);
        }
    }, [isConfigured]);

    /**
     * Rafraîchit les paramètres
     */
    const refresh = useCallback(async () => {
        invalidateSettingsCache();
        await loadSettings();
    }, [loadSettings]);

    /**
     * Récupère un paramètre spécifique
     */
    const getSettingValue = useCallback(async (key: string): Promise<Setting | null> => {
        return await getSetting(key);
    }, []);

    /**
     * Invalide le cache
     */
    const invalidateCache = useCallback(() => {
        invalidateSettingsCache();
    }, []);

    // Chargement initial
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return {
        isLoading,
        error,
        isConfigured,
        constants,
        bt01Data,
        refresh,
        getSetting: getSettingValue,
        invalidateCache,
    };
}

// =============================================================================
// HOOKS SPÉCIALISÉS
// =============================================================================

/**
 * Hook pour accéder uniquement aux données de pricing
 */
export function usePricingData() {
    const { constants, isLoading, error } = useDynamicSettings();
    
    return {
        isLoading,
        error,
        basePricePerSqm: constants.basePricePerSqm,
        estimatedRenoCostPerSqm: constants.estimatedRenoCostPerSqm,
    };
}

/**
 * Hook pour accéder uniquement aux taux d'inflation
 */
export function useInflationData() {
    const { bt01Data, constants, isLoading, error } = useDynamicSettings();
    
    return {
        isLoading,
        error,
        bt01Rate: constants.bt01InflationRate,
        bt01Display: bt01Data?.display,
        constructionInflationRate: constants.constructionInflationRate,
    };
}

/**
 * Hook pour accéder aux paramètres d'aides
 */
export function useAidRates() {
    const { constants, isLoading, error } = useDynamicSettings();
    
    return {
        isLoading,
        error,
        // MPR
        mprActive: constants.mprCoproActive,
        mprMinEnergyGain: constants.mprMinEnergyGain,
        mprStandardRate: constants.mprStandardRate,
        mprPerformanceRate: constants.mprPerformanceRate,
        mprExitPassoireBonus: constants.mprExitPassoireBonus,
        mprCeilingPerUnit: constants.mprCeilingPerUnit,
        // AMO
        amoCostPerLot: constants.amoCostPerLot,
        amoAidRate: constants.amoAidRate,
        // Eco-PTZ
        ecoPtzRate: constants.ecoPtzRate,
    };
}

/**
 * Hook pour accéder aux paramètres de projet
 */
export function useProjectFees() {
    const { constants, isLoading, error } = useDynamicSettings();
    
    return {
        isLoading,
        error,
        syndicRate: constants.syndicRate,
        doRate: constants.doRate,
        contingencyRate: constants.contingencyRate,
        tvaRate: constants.tvaRenovationRate,
    };
}

export type { DynamicConstants, Setting, BT01Data };
