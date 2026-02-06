/**
 * VALO-SYNDIC — PPTX Generator Entry Point
 * ========================================
 */

import PptxGenJS from 'pptxgenjs';
import { type DiagnosticResult } from '@/lib/schemas';
import { formatCurrency } from '@/lib/calculator';
import { type PPTXBrand } from './types';
import { COLORS } from './theme';
import { getProjectStory, calculateProfileBreakdown } from './utils';
import {
    defineMasterSlide,
    addSlide1_Title,
    addSlide2_Problem,
    addSlide3_Urgency,
    addSlide4_Solution,
    addSlide5_Financing,
    addSlide6_Gains,
    addSlide7_Inaction,
    addSlide8_Profiles,
    addSlide9_Quality,
    addSlide10_Vote
} from './slides';

export * from './types'; // Re-export types if needed

/**
 * Générateur Principal
 */
export async function generateAGPresentation(
    result: DiagnosticResult,
    brand?: PPTXBrand,
    scenarioTitle?: string,
    outputType: 'blob' | 'nodebuffer' | 'base64' = 'blob'
): Promise<Blob | Buffer | string> {
    const pptx = new PptxGenJS();

    // Configuration de base
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = brand?.agencyName || 'VALO SYNDIC';
    pptx.title = scenarioTitle || `Présentation AG - ${result.input.address || 'Copropriété'}`;
    pptx.subject = 'Rénovation énergétique - Vote AG';

    // Définition du master slide
    defineMasterSlide(pptx, brand);

    // Calculs préliminaires
    const story = getProjectStory(result);
    const monthlyPayment = Math.round((result.financing.ecoPtzAmount * 0.1) / 240);
    const profileBreakdown = calculateProfileBreakdown(result.input.numberOfUnits);

    // Génération des 10 slides
    addSlide1_Title(pptx, result, story);
    addSlide2_Problem(pptx, result);
    addSlide3_Urgency(pptx, result);
    addSlide4_Solution(pptx, result, story);
    addSlide5_Financing(pptx, result, monthlyPayment);
    addSlide6_Gains(pptx, result);
    addSlide7_Inaction(pptx, result);
    addSlide8_Profiles(pptx, profileBreakdown, monthlyPayment);
    addSlide9_Quality(pptx);
    addSlide10_Vote(pptx, result);

    // Génération du blob
    return await pptx.write({ outputType: outputType }) as Blob | Buffer | string;
}

/**
 * Génère uniquement le slide financement (pour démonstration rapide)
 */
export async function generateFinancingSlideOnly(
    result: DiagnosticResult,
    brand?: PPTXBrand
): Promise<Blob> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    defineMasterSlide(pptx, brand);

    const monthlyPayment = Math.round((result.financing.ecoPtzAmount * 0.1) / 240);
    addSlide5_Financing(pptx, result, monthlyPayment);

    return await pptx.write({ outputType: 'blob' }) as Blob;
}

/**
 * Retourne les métadonnées d'une présentation sans la générer
 */
export function getPresentationMetadata(result: DiagnosticResult): {
    slideCount: number;
    estimatedDuration: string;
    keyFigures: { label: string; value: string }[];
} {
    const monthlyPayment = Math.round((result.financing.ecoPtzAmount * 0.1) / 240);

    return {
        slideCount: 10,
        estimatedDuration: '15 minutes',
        keyFigures: [
            { label: 'Mensualité lot moyen', value: `${monthlyPayment}€` },
            { label: 'Plus-value estimée', value: formatCurrency(result.valuation.greenValueGain) },
            { label: 'Coût inaction 3 ans', value: formatCurrency(result.inactionCost.totalInactionCost) },
            { label: 'Aides disponibles', value: formatCurrency(result.financing.mprAmount + result.financing.amoAmount) },
        ],
    };
}
