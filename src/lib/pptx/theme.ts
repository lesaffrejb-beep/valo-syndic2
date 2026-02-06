/**
 * PPTX Theme Definitions
 */

export const COLORS = {
    // Palette AG (fond foncé pour projection)
    background: '1E3A5F',    // Bleu navy
    text: 'FFFFFF',          // Blanc
    accent: 'D4AF37',        // Or
    success: '22C55E',       // Vert
    danger: 'EF4444',        // Rouge
    info: '3B82F6',          // Bleu
    muted: '94A3B8',         // Gris clair
};

export const FONTS = {
    title: { name: 'Arial', size: 44, bold: true, color: COLORS.text },
    headline: { name: 'Arial', size: 72, bold: true, color: COLORS.text },
    subtitle: { name: 'Arial', size: 32, color: COLORS.text },
    body: { name: 'Arial', size: 24, color: COLORS.text },
    note: { name: 'Arial', size: 18, color: COLORS.muted },
    accent: { name: 'Arial', size: 28, bold: true, color: COLORS.accent },
};
