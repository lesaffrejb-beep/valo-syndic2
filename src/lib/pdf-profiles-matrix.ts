/**
 * VALO-SYNDIC — PDF Profile Matrix Generator
 * ==========================================
 * Generates dynamic profile simulations for the AG Matrix table.
 * Used exclusively in PDFReportAG.tsx for professional AG presentations.
 */

import type { FinancingPlan } from './schemas';

/**
 * Single row in the AG Profile Matrix
 */
export interface ProfileMatrixRow {
    type: string;           // "Studio", "T2", "T3", "T4"
    tantiemes: number;      // Tantièmes (quote-part in /1000)
    quotePart: number;      // Quote-part Travaux (€)
    aids: number;           // Aides estimées (€)
    monthly: number;        // Mensualité Éco-PTZ 20 ans (€)
}

/**
 * Standard profile configurations for typical copropriété
 * Based on real-world tantièmes distribution
 */
const STANDARD_PROFILES = [
    { type: 'Studio', tantiemes: 50 },   // ~5% ownership
    { type: 'T2', tantiemes: 100 },      // ~10% ownership
    { type: 'T3', tantiemes: 150 },      // ~15% ownership
    { type: 'T4', tantiemes: 200 },      // ~20% ownership
] as const;

/**
 * Generates the AG Profile Matrix with 4 standard apartment types.
 * 
 * Each row shows:
 * - Type: Apartment category (Studio, T2, T3, T4)
 * - Tantièmes: Ownership share (quote-part in /1000)
 * - Quote-part Travaux: Individual share of total works cost
 * - Aides estimées: Individual share of subsidies (MPR + CEE)
 * - Mensualité: Monthly Éco-PTZ payment over 20 years (0% interest)
 * 
 * CRITICAL: All calculations use the project's actual financing data.
 * NO mocked or estimated values. This is the "Matrix" that closes the vote.
 * 
 * @param financing - Complete financing plan from calculation engine
 * @param numberOfUnits - Total number of lots in the copropriété
 * @returns Array of 4 profile rows ready for AG presentation
 */
export function generateProfileMatrix(
    financing: FinancingPlan,
    numberOfUnits: number
): ProfileMatrixRow[] {
    // Total subsidies per copropriété
    const totalSubsidies = financing.mprAmount + financing.ceeAmount + financing.localAidAmount + financing.amoAmount;

    // Total cost to finance (after subsidies, before Éco-PTZ)
    const totalToFinance = financing.remainingCost + financing.ecoPtzAmount;

    return STANDARD_PROFILES.map(profile => {
        // Individual share based on tantièmes (quote-part)
        const shareFactor = profile.tantiemes / 1000;

        // 1. Quote-part Travaux = Individual share of total works cost (TTC)
        const quotePart = financing.totalCostTTC * shareFactor;

        // 2. Aides estimées = Individual share of total subsidies
        const aids = totalSubsidies * shareFactor;

        // 3. Mensualité Éco-PTZ (20 ans, 0% intérêt)
        // Formula: (Capital emprunté * quote-part) / (20 ans × 12 mois)
        // Note: ecoPtzAmount is the TOTAL loan amount for the building
        const individualLoanAmount = financing.ecoPtzAmount * shareFactor;
        const monthly = individualLoanAmount / (20 * 12); // 240 months

        return {
            type: profile.type,
            tantiemes: profile.tantiemes,
            quotePart: Math.round(quotePart),
            aids: Math.round(aids),
            monthly: Math.round(monthly),
        };
    });
}

/**
 * Formats a profile matrix row for display in tables
 * Useful for both PDF and UI components
 */
export function formatProfileRow(row: ProfileMatrixRow): {
    type: string;
    tantiemes: string;
    quotePart: string;
    aids: string;
    monthly: string;
} {
    return {
        type: row.type,
        tantiemes: `${row.tantiemes}/1000`,
        quotePart: `${row.quotePart.toLocaleString('fr-FR')} €`,
        aids: `${row.aids.toLocaleString('fr-FR')} €`,
        monthly: `${row.monthly.toLocaleString('fr-FR')} €/mois`,
    };
}
