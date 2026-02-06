/**
 * PPTX Utility Functions
 */

import { type DiagnosticResult } from '@/lib/schemas';

/**
 * Calcule le nombre de lots par profil représentatif
 */
export function calculateProfileBreakdown(totalLots: number): { profile: string; lots: number; label: string }[] {
    // Répartition statistique type d'une copropriété
    return [
        { profile: 'young_family', lots: Math.round(totalLots * 0.25), label: 'Jeunes ménages' },
        { profile: 'retired_fixed_income', lots: Math.round(totalLots * 0.30), label: 'Retraités' },
        { profile: 'professional_landlord', lots: Math.round(totalLots * 0.20), label: 'Investisseurs' },
        { profile: 'busy_professional', lots: Math.round(totalLots * 0.15), label: 'Actifs occupés' },
        { profile: 'others', lots: Math.round(totalLots * 0.10), label: 'Autres' },
    ];
}

/**
 * Génère le storytelling adapté au montant du projet
 */
export function getProjectStory(result: DiagnosticResult): {
    scale: 'small' | 'medium' | 'large' | 'very-large';
    impactPhrase: string;
    comparisonItem: string;
} {
    const costPerLot = result.financing.costPerUnit;

    if (costPerLot < 20000) {
        return {
            scale: 'small',
            impactPhrase: 'Une rénovation légère mais efficace',
            comparisonItem: 'une place de parking'
        };
    } else if (costPerLot < 50000) {
        return {
            scale: 'medium',
            impactPhrase: 'Une rénovation complète de notre patrimoine',
            comparisonItem: 'une petite voiture'
        };
    } else if (costPerLot < 100000) {
        return {
            scale: 'large',
            impactPhrase: 'Une transformation majeure de notre immeuble',
            comparisonItem: 'un appartement T2'
        };
    } else {
        return {
            scale: 'very-large',
            impactPhrase: 'Un projet ambitieux pour sauver notre patrimoine',
            comparisonItem: 'une maison individuelle'
        };
    }
}
