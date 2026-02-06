/**
 * VALO-SYNDIC — useProjectSave Hook
 * ==================================
 * Save projects to Supabase with Hive Mind intelligence
 */

"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { DiagnosticResult } from '@/lib/schemas';
import { MarketStatsSchema } from '@/lib/schemas';

interface UseProjectSaveReturn {
    saveProject: (simulationData: DiagnosticResult, projectName?: string) => Promise<string | null>;
    isLoading: boolean;
    error: string | null;
    showAuthModal: boolean;
    setShowAuthModal: (show: boolean) => void;
}

export function useProjectSave(): UseProjectSaveReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const saveProject = async (
        simulationData: DiagnosticResult,
        projectName?: string
    ): Promise<string | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Check authentication
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setShowAuthModal(true);
                setIsLoading(false);
                return null;
            }

            // 2. Prepare simulation data
            const simulationRecord = {
                user_id: user.id,
                user_email: user.email,
                project_name: projectName || `Simulation ${simulationData.input.city || 'Sans nom'}`,
                city: simulationData.input.city || null,
                postal_code: simulationData.input.postalCode || null,
                json_data: simulationData,
                status: 'draft' as const,
            };

            // 3. Save to simulations table
            const { data: savedSimulation, error: saveError } = await supabase
                .from('simulations')
                .insert(simulationRecord)
                .select()
                .single();

            if (saveError) {
                throw new Error(`Erreur de sauvegarde: ${saveError.message}`);
            }

            // 4. Fire & Forget: Save anonymous market stats (Hive Mind)
            saveMarketStats(simulationData).catch(err => {
                console.warn('Failed to save market stats (non-critical):', err);
            });

            setIsLoading(false);
            return savedSimulation.id;

        } catch (err) {
            console.error('Save project error:', err);
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            setIsLoading(false);
            return null;
        }
    };

    return {
        saveProject,
        isLoading,
        error,
        showAuthModal,
        setShowAuthModal,
    };
}

/**
 * Save anonymous market statistics (Hive Mind)
 * Non-blocking, fire-and-forget operation
 */
async function saveMarketStats(simulationData: DiagnosticResult): Promise<void> {
    try {
        // Calculate cost per sqm if possible
        const costPerSqm = simulationData.input.averageUnitSurface
            ? simulationData.financing.costPerUnit / simulationData.input.averageUnitSurface
            : undefined;

        // Calculate subsidy rate
        const subsidyRate = simulationData.financing.totalCostHT > 0
            ? (simulationData.financing.mprAmount + simulationData.financing.amoAmount) / simulationData.financing.totalCostHT
            : undefined;

        const marketStats = MarketStatsSchema.parse({
            postal_code: simulationData.input.postalCode,
            city: simulationData.input.city,
            current_dpe: simulationData.input.currentDPE,
            target_dpe: simulationData.input.targetDPE,
            cost_per_sqm: costPerSqm,
            number_of_units: simulationData.input.numberOfUnits,
            work_cost_ht: simulationData.financing.worksCostHT,
            subsidy_rate: subsidyRate,
        });

        const { error } = await supabase
            .from('market_stats')
            .insert(marketStats);

        if (error) {
            // Non-critical error, just log it
            console.warn('Market stats insert failed:', error);
        }
    } catch (err) {
        // Validation or network error - non-critical
        console.warn('Market stats save failed:', err);
    }
}
