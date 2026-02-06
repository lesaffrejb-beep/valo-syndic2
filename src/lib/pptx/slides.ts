/**
 * PPTX Slide Generators
 */

import PptxGenJS from 'pptxgenjs';
import { type DiagnosticResult } from '@/lib/schemas';
import { formatCurrency } from '@/lib/calculator';
import { COLORS, FONTS } from './theme';
import { type PPTXBrand } from './types';
import { calculateProfileBreakdown, getProjectStory } from './utils';

// =============================================================================
// MASTER SLIDE
// =============================================================================

export function defineMasterSlide(pptx: PptxGenJS, brand?: PPTXBrand): void {
    const primaryColor = brand?.primaryColor || COLORS.accent;

    pptx.defineSlideMaster({
        title: 'MASTER_AG',
        background: { color: COLORS.background },
        objects: [
            // Bandeau haut
            {
                rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: primaryColor } },
            },
            // Logo / Nom d'agence (footer)
            {
                text: {
                    text: brand?.agencyName || 'VALO SYNDIC',
                    options: {
                        x: 0.5, y: '90%', w: 4, h: 0.5,
                        fontSize: 14, color: COLORS.muted,
                    },
                },
            },
        ],
    });
}

// =============================================================================
// SLIDES INDIVIDUELS
// =============================================================================

/**
 * SLIDE 1 : Titre / Accroche
 */
export function addSlide1_Title(
    pptx: PptxGenJS,
    result: DiagnosticResult,
    story: ReturnType<typeof getProjectStory>
): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('L\'AVENIR DE NOTRE IMMEUBLE', {
        x: 1, y: 2, w: '80%', h: 1,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText('SE DÉCIDE AUJOURD\'HUI', {
        x: 1, y: 3, w: '80%', h: 0.8,
        fontSize: FONTS.subtitle.size,
        color: COLORS.accent,
        align: 'center',
    });

    slide.addText([
        { text: `${result.input.numberOfUnits} lots • `, options: { color: COLORS.muted } },
        { text: result.input.city || 'Notre ville', options: { color: COLORS.muted } },
    ], {
        x: 1, y: 5, w: '80%', h: 0.5,
        align: 'center',
    });

    slide.addText(new Date().toLocaleDateString('fr-FR'), {
        x: 1, y: 6, w: '80%', h: 0.3,
        fontSize: FONTS.note.size,
        color: COLORS.muted,
        align: 'center',
    });
}

/**
 * SLIDE 2 : Le Problème
 */
export function addSlide2_Problem(pptx: PptxGenJS, result: DiagnosticResult): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('NOTRE IMMEUBLE AUJOURD\'HUI', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText(result.input.currentDPE, {
        x: 4, y: 2, w: 2, h: 2,
        fontSize: 120,
        bold: true,
        color: COLORS.danger,
        align: 'center',
    });

    slide.addText('CLASSE ÉNERGÉTIQUE', {
        x: 1, y: 1.8, w: '80%', h: 0.4,
        fontSize: FONTS.note.size,
        color: COLORS.muted,
        align: 'center',
    });

    const problems = [
        '• 40% de chaleur perdue',
        '• Factures de chauffage élevées',
        '• Confort d\'hiver dégradé',
    ].join('\n');

    slide.addText(problems, {
        x: 2, y: 4.5, w: '60%', h: 2,
        fontSize: FONTS.body.size,
        color: COLORS.text,
        lineSpacing: 40,
    });
}

/**
 * SLIDE 3 : L'Urgence Légale
 */
export function addSlide3_Urgency(pptx: PptxGenJS, result: DiagnosticResult): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('LE TEMPS NOUS EST COMPTE', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    const isPassoire = result.input.currentDPE === 'F' || result.input.currentDPE === 'G';
    const deadline = result.compliance.prohibitionDate;

    if (isPassoire && deadline) {
        const year = deadline.getFullYear();
        const daysLeft = result.compliance.daysUntilProhibition || 0;
        const monthsLeft = Math.floor(daysLeft / 30);

        slide.addText(`${year}`, {
            x: 4, y: 2, w: 2, h: 1.5,
            fontSize: 100,
            bold: true,
            color: COLORS.danger,
            align: 'center',
        });

        slide.addText('INTERDICTION DE LOCATION', {
            x: 1, y: 3.5, w: '80%', h: 0.5,
            fontSize: FONTS.subtitle.size,
            color: COLORS.danger,
            align: 'center',
        });

        slide.addText(`${monthsLeft} MOIS POUR AGIR`, {
            x: 1, y: 4.5, w: '80%', h: 0.6,
            fontSize: FONTS.accent.size,
            bold: true,
            color: COLORS.accent,
            align: 'center',
        });
    } else {
        slide.addText('VOTRE SITUATION EST SOUS CONTRÔLE', {
            x: 1, y: 2.5, w: '80%', h: 1,
            fontSize: FONTS.subtitle.size,
            color: COLORS.success,
            align: 'center',
        });

        slide.addText('Mais anticiper maintenant = économiser', {
            x: 1, y: 4, w: '80%', h: 0.5,
            fontSize: FONTS.body.size,
            color: COLORS.text,
            align: 'center',
        });
    }
}

/**
 * SLIDE 4 : La Solution
 */
export function addSlide4_Solution(
    pptx: PptxGenJS,
    result: DiagnosticResult,
    story: ReturnType<typeof getProjectStory>
): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('NOTRE PROJET DE RÉNOVATION', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText(story.impactPhrase.toUpperCase(), {
        x: 1, y: 1.8, w: '80%', h: 0.6,
        fontSize: 20,
        color: COLORS.accent,
        align: 'center',
    });

    const works = [
        '✓ Isolation thermique extérieure',
        '✓ Remplacement des menuiseries',
        '✓ Isolation des combles',
        '✓ VMC double flux',
    ].join('\n');

    slide.addText(works, {
        x: 2, y: 3, w: '60%', h: 2.5,
        fontSize: FONTS.body.size,
        color: COLORS.text,
        lineSpacing: 45,
    });

    slide.addText(`OBJECTIF : CLasse ${result.input.targetDPE}`, {
        x: 1, y: 5.8, w: '80%', h: 0.5,
        fontSize: FONTS.accent.size,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });
}

/**
 * SLIDE 5 : Le Financement
 */
export function addSlide5_Financing(
    pptx: PptxGenJS,
    result: DiagnosticResult,
    monthlyPayment: number
): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('VOTRE MENSUALITÉ', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText(`${monthlyPayment}€`, {
        x: 3.5, y: 2, w: 3, h: 1.5,
        fontSize: 100,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });

    slide.addText('PAR MOIS POUR UN LOT MOYEN', {
        x: 1, y: 3.5, w: '80%', h: 0.5,
        fontSize: FONTS.subtitle.size,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText('Moins qu\'un abonnement télécom', {
        x: 1, y: 4.3, w: '80%', h: 0.4,
        fontSize: FONTS.body.size,
        color: COLORS.muted,
        align: 'center',
    });

    const chartData = [
        { name: 'Aides', value: result.financing.mprAmount + result.financing.amoAmount, color: COLORS.success },
        { name: 'Éco-PTZ', value: result.financing.ecoPtzAmount, color: COLORS.info },
        { name: 'Reste à charge', value: result.financing.remainingCost, color: COLORS.accent },
    ];

    slide.addChart('doughnut', chartData.map(d => [d.name, d.value]), {
        x: 6, y: 2, w: 3.5, h: 3.5,
        chartColors: chartData.map(d => d.color),
        showLegend: true,
        legendPos: 'b',
        legendFontSize: 10,
    });
}

/**
 * SLIDE 6 : Ce qu'on gagne
 */
export function addSlide6_Gains(pptx: PptxGenJS, result: DiagnosticResult): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('CE QUE VOUS GAGNEZ', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText('-40%', {
        x: 1, y: 2.5, w: 4, h: 1,
        fontSize: 80,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });

    slide.addText('SUR VOTRE', {
        x: 1, y: 3.5, w: 4, h: 0.3,
        fontSize: 18,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText('CHAUFFAGE', {
        x: 1, y: 3.8, w: 4, h: 0.3,
        fontSize: 18,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });

    const gainPercent = Math.round(result.valuation.greenValueGainPercent * 100);

    slide.addText(`+${gainPercent}%`, {
        x: 5, y: 2.5, w: 4, h: 1,
        fontSize: 80,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });

    slide.addText('SUR LA', {
        x: 5, y: 3.5, w: 4, h: 0.3,
        fontSize: 18,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText('VALEUR DE VOTRE BIEN', {
        x: 5, y: 3.8, w: 4, h: 0.3,
        fontSize: 18,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });

    slide.addText(formatCurrency(result.valuation.greenValueGain), {
        x: 1, y: 5, w: '80%', h: 0.8,
        fontSize: FONTS.headline.size,
        bold: true,
        color: COLORS.accent,
        align: 'center',
    });

    slide.addText('DE PLUS-VALUE ESTIMÉE', {
        x: 1, y: 5.8, w: '80%', h: 0.4,
        fontSize: FONTS.body.size,
        color: COLORS.muted,
        align: 'center',
    });
}

/**
 * SLIDE 7 : Inaction
 */
export function addSlide7_Inaction(pptx: PptxGenJS, result: DiagnosticResult): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('SI ON ATTEND 3 ANS...', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    const lossAmount = formatCurrency(result.inactionCost.totalInactionCost);

    slide.addText(lossAmount, {
        x: 2, y: 2, w: 6, h: 1.5,
        fontSize: 90,
        bold: true,
        color: COLORS.danger,
        align: 'center',
    });

    slide.addText('PERDUS', {
        x: 1, y: 3.5, w: '80%', h: 0.6,
        fontSize: FONTS.subtitle.size,
        color: COLORS.danger,
        align: 'center',
    });

    const details = [
        `+${formatCurrency(result.inactionCost.projectedCost3Years - result.inactionCost.currentCost)} d'inflation travaux`,
        'Aides qui diminuent chaque année',
        'Valeur de votre bien qui stagne',
    ].join('\n');

    slide.addText(details, {
        x: 2, y: 4.5, w: '60%', h: 2,
        fontSize: FONTS.body.size,
        color: COLORS.text,
        lineSpacing: 40,
    });
}

/**
 * SLIDE 8 : Profils
 */
export function addSlide8_Profiles(
    pptx: PptxGenJS,
    breakdown: ReturnType<typeof calculateProfileBreakdown>,
    monthlyPayment: number
): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('QUEL QUE SOIT VOTRE PROFIL...', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    const profiles = [
        { label: 'JEUNES MÉNAGES', payment: Math.round(monthlyPayment * 0.85), icon: 'J' },
        { label: 'FAMILLES', payment: monthlyPayment, icon: 'F' },
        { label: 'RETRAITÉS', payment: Math.round(monthlyPayment * 0.75), icon: 'R' },
        { label: 'INVESTISSEURS', payment: Math.round(monthlyPayment * 1.1), icon: 'I' },
    ];

    profiles.forEach((profile, index) => {
        const x = 1 + (index * 2.2);
        const y = 3;

        slide.addText(profile.icon, {
            x, y, w: 1.5, h: 1,
            fontSize: 40,
            bold: true,
            color: COLORS.accent,
            align: 'center',
        });

        slide.addText(profile.label, {
            x, y: y + 1.1, w: 1.8, h: 0.6,
            fontSize: 12,
            color: COLORS.text,
            align: 'center',
        });

        slide.addText(`${profile.payment}€/mois`, {
            x, y: y + 1.7, w: 1.8, h: 0.4,
            fontSize: 14,
            bold: true,
            color: COLORS.success,
            align: 'center',
        });
    });

    slide.addText('UNE SOLUTION ADAPTÉE POUR CHACUN', {
        x: 1, y: 5.5, w: '80%', h: 0.5,
        fontSize: FONTS.body.size,
        color: COLORS.muted,
        align: 'center',
    });
}

/**
 * SLIDE 9 : Qualité
 */
export function addSlide9_Quality(pptx: PptxGenJS): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('VOUS ÊTES ACCOMPAGNÉS', {
        x: 1, y: 0.8, w: '80%', h: 0.8,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    const commitments = [
        '✓ Artisans certifiés RGE',
        '✓ Garantie décennale sur tous les travaux',
        '✓ Syndic gestionnaire de projet',
        '✓ Aucune démarche administrative pour vous',
        '✓ Accompagnement personnalisé',
    ].join('\n');

    slide.addText(commitments, {
        x: 2, y: 2.5, w: '60%', h: 3,
        fontSize: FONTS.body.size,
        color: COLORS.text,
        lineSpacing: 50,
    });

    slide.addText('TRANQUILLITÉ D\'ESPRIT GARANTIE', {
        x: 1, y: 5.5, w: '80%', h: 0.5,
        fontSize: FONTS.accent.size,
        bold: true,
        color: COLORS.accent,
        align: 'center',
    });
}

/**
 * SLIDE 10 : Vote
 */
export function addSlide10_Vote(pptx: PptxGenJS, result: DiagnosticResult): void {
    const slide = pptx.addSlide({ masterName: 'MASTER_AG' });

    slide.addText('VOTEZ POUR L\'AVENIR', {
        x: 1, y: 1, w: '80%', h: 1,
        fontSize: FONTS.title.size,
        bold: true,
        color: COLORS.text,
        align: 'center',
    });

    slide.addText('"Cet immeuble, c\'est le nôtre."', {
        x: 1, y: 2.5, w: '80%', h: 0.8,
        fontSize: FONTS.subtitle.size,
        color: COLORS.accent,
        align: 'center',
        italic: true,
    });

    slide.addText('"Préservons-le ensemble."', {
        x: 1, y: 3.3, w: '80%', h: 0.6,
        fontSize: FONTS.subtitle.size,
        color: COLORS.accent,
        align: 'center',
        italic: true,
    });

    slide.addText('→ VOTEZ POUR ←', {
        x: 1, y: 4.5, w: '80%', h: 0.8,
        fontSize: FONTS.headline.size,
        bold: true,
        color: COLORS.success,
        align: 'center',
    });

    const monthlyPayment = Math.round((result.financing.ecoPtzAmount * 0.1) / 240);
    slide.addText(`${monthlyPayment}€/mois • +${Math.round(result.valuation.greenValueGainPercent * 100)}% valeur • -40% chauffage`, {
        x: 1, y: 5.5, w: '80%', h: 0.4,
        fontSize: FONTS.note.size,
        color: COLORS.muted,
        align: 'center',
    });
}
