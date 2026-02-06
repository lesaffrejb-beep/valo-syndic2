'use server'

import { generateDiagnostic } from '@/lib/calculator'
import { DiagnosticInputSchema, type DiagnosticInput, type DiagnosticResult } from '@/lib/schemas'

/**
 * Server Action — Génération de diagnostic patrimonial
 * Protège la logique métier côté serveur
 * 
 * Cette action sécurise l'algorithme de calcul MaPrimeRénov' Copropriété 2026
 * en le maintenant côté serveur, inaccessible au client.
 */
export async function simulateDiagnostic(
    rawInput: unknown
): Promise<{ success: true; data: DiagnosticResult } | { success: false; error: string }> {
    try {
        // Validation Zod server-side (double couche de sécurité)
        const validatedInput = DiagnosticInputSchema.parse(rawInput) as DiagnosticInput

        // Exécution du calcul (logique protégée)
        const result = generateDiagnostic(validatedInput)

        return { success: true, data: result }
    } catch (error) {
        console.error('[Server Action] Simulation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur de calcul interne'
        }
    }
}
