/**
 * VALO-SYNDIC — PDF Document Professionnel
 * ========================================
 * Génération de rapports PDF pour Assemblées Générales.
 * 
 * DESIGN PHILOSOPHY:
 * - Zero emoji (encoding issues with Helvetica)
 * - ASCII symbols only for icons
 * - Professional financial report aesthetic
 * - Dynamic content based on profiles
 * 
 * @version 2.0 - Profile-aware architecture
 */

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { type DiagnosticResult } from '@/lib/schemas';
import { formatCurrency, formatPercent, sanitizeText } from '@/lib/calculator';

// Register specific weights if using custom fonts, otherwise standard fonts:
// Helvetica (Sans), Times-Roman (Serif)

// =============================================================================
// 1. THEME & DESIGN SYSTEM (Matte Luxury)
// =============================================================================

const C = {
    // Primary palette
    primary: '#0F172A', // Slate 900 (Darker)
    primaryLight: '#334155', // Slate 700
    gold: '#CA8A04', // Yellow 600 (Dark Gold)
    goldLight: '#FDE047', // Yellow 300

    // Neutrals
    bg: '#FFFFFF',
    bgSection: '#F8FAFC', // Slate 50
    bgHighlight: '#FEFCE8', // Yellow 50

    // Text
    text: '#1E293B', // Slate 800
    textSecondary: '#475569', // Slate 600
    textMuted: '#94A3B8', // Slate 400

    // Semantic
    success: '#15803D', // Green 700
    successLight: '#DCFCE7', // Green 100
    warning: '#B45309', // Amber 700
    warningLight: '#FEF3C7', // Amber 100
    danger: '#B91C1C', // Red 700
    dangerLight: '#FEE2E2', // Red 100

    // Borders
    border: '#E2E8F0', // Slate 200
    borderLight: '#F1F5F9', // Slate 100
};

// =============================================================================
// 2. STYLES
// =============================================================================

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: C.bg,
        padding: 0,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: C.text,
    },

    headerBand: {
        height: 6,
        backgroundColor: C.primary,
        borderBottomWidth: 1,
        borderBottomColor: C.gold,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },

    brandTitle: {
        fontSize: 22,
        fontFamily: 'Times-Bold', // Serif for Luxury
        color: C.primary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    brandSubtitle: {
        fontSize: 9,
        color: C.gold,
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontFamily: 'Helvetica-Bold',
    },

    headerMeta: {
        alignItems: 'flex-end',
    },

    pageIndicator: {
        fontSize: 8,
        color: C.gold,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    date: {
        fontSize: 9,
        color: C.textMuted,
        marginTop: 4,
    },

    content: {
        paddingHorizontal: 40,
        paddingVertical: 24,
    },

    pageTitle: {
        fontSize: 24, // Larger title
        fontFamily: 'Times-Bold', // Serif
        color: C.primary,
        marginBottom: 20,
        textTransform: 'uppercase', // Editorial feel
        letterSpacing: 1,
    },

    section: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: C.bgSection,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: C.gold,
    },

    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Times-Bold', // Serif
        color: C.gold, // Gold headers
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 2, // Wide tracking
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: C.borderLight,
    },

    rowNoBorder: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },

    label: {
        fontSize: 9,
        color: C.textSecondary,
    },

    value: {
        fontSize: 9,
        color: C.text,
        fontFamily: 'Helvetica-Bold',
    },

    bigNumber: {
        fontSize: 32,
        fontFamily: 'Times-Bold',
        letterSpacing: -1,
    },

    heroBox: {
        padding: 16,
        borderRadius: 6,
        marginVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
    },

    heroLabel: {
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },

    heroValue: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 8,
        color: C.textSecondary,
    },

    table: {
        marginTop: 8,
    },

    tableHeader: {
        flexDirection: 'row',
        backgroundColor: C.primary,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 3,
    },

    tableHeaderCell: {
        flex: 1,
        fontSize: 8,
        color: '#FFF',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    tableHeaderCellRight: {
        flex: 1,
        fontSize: 8,
        color: '#FFF',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'right',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    tableRow: {
        flexDirection: 'row',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: C.borderLight,
    },

    tableCell: {
        flex: 1,
        fontSize: 9,
        color: C.text,
    },

    tableCellRight: {
        flex: 1,
        fontSize: 9,
        textAlign: 'right',
        color: C.text,
    },

    dpeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 12,
    },

    dpeBox: {
        width: 60,
        height: 60,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    dpeLabel: {
        fontSize: 8,
        color: C.textMuted,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    dpeLetter: {
        fontSize: 32,
        color: '#FFF',
        fontFamily: 'Helvetica-Bold',
    },

    dpeArrow: {
        fontSize: 24,
        color: C.success,
        marginHorizontal: 20,
        fontFamily: 'Helvetica-Bold',
    },

    progressBar: {
        height: 16,
        backgroundColor: C.borderLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 6,
    },

    progressFill: {
        height: '100%',
        borderRadius: 3,
    },

    progressLabel: {
        fontSize: 8,
        color: C.textMuted,
        marginTop: 4,
        textAlign: 'right',
    },

    callout: {
        padding: 10,
        borderRadius: 4,
        marginTop: 10,
        borderLeftWidth: 3,
    },

    calloutText: {
        fontSize: 9,
    },

    quote: {
        padding: 12,
        backgroundColor: C.bgHighlight,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: C.gold,
        marginTop: 12,
    },

    quoteText: {
        fontSize: 11,
        color: C.primary,
        fontFamily: 'Times-Italic', // Elegant serif italic
        lineHeight: 1.5,
    },

    quoteSource: {
        fontSize: 8,
        color: C.textMuted,
        marginTop: 6,
    },

    footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        paddingTop: 10,
        borderTopWidth: 0.5,
        borderTopColor: C.border,
    },

    footerText: {
        fontSize: 7,
        color: C.textMuted,
        textAlign: 'center',
    },

    disclaimer: {
        fontSize: 6,
        color: C.textMuted,
        textAlign: 'center',
        marginTop: 4,
        fontStyle: 'italic',
    },

    twoColumn: {
        flexDirection: 'row',
        gap: 12,
    },

    column: {
        flex: 1,
    },

    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },

    badgeText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    methodology: {
        fontSize: 7,
        color: C.textMuted,
        marginTop: 8,
        fontStyle: 'italic',
    },
});

// =============================================================================
// 3. TYPES & INTERFACES
// =============================================================================

interface PDFBrand {
    agencyName?: string;
    primaryColor?: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
}

interface PDFDocumentProps {
    result: DiagnosticResult;
    brand?: PDFBrand | undefined;
}

// =============================================================================
// 4. HELPER FUNCTIONS
// =============================================================================

const getDPEColor = (dpe: string): string => {
    const colors: Record<string, string> = {
        G: '#DC2626',
        F: '#EA580C',
        E: '#D97706',
        D: '#EAB308',
        C: '#84CC16',
        B: '#22C55E',
        A: '#059669',
    };
    return colors[dpe] || C.text;
};

const getUrgencyInfo = (
    compliance: DiagnosticResult['compliance'],
    dpe: string
): { score: number; label: string; color: string } => {
    if (compliance.isProhibited) {
        return { score: 100, label: 'CRITIQUE', color: C.danger };
    }
    if (!compliance.prohibitionDate) {
        return { score: 20, label: 'CONFORME', color: C.success };
    }
    const days = compliance.daysUntilProhibition || 0;
    if (days <= 365) return { score: 95, label: 'CRITIQUE', color: C.danger };
    if (days <= 730) return { score: 85, label: 'URGENT', color: C.danger };
    if (days <= 1095) return { score: 70, label: 'ATTENTION', color: C.warning };
    return { score: 50, label: 'MODERE', color: C.warning };
};

// =============================================================================
// 5. SECTION COMPONENTS
// =============================================================================

const Header = ({ pageNum, title, brand }: { pageNum: number; title: string; brand?: PDFBrand | undefined }) => (
    <View>
        <View style={[styles.headerBand, { backgroundColor: brand?.primaryColor || C.gold }]} />
        <View style={styles.header}>
            <View>
                <Text style={styles.brandTitle}>{brand?.agencyName || 'VALO SYNDIC'}</Text>
                <Text style={styles.brandSubtitle}>Audit Patrimonial & Financier</Text>
            </View>
            <View style={styles.headerMeta}>
                <Text style={styles.pageIndicator}>Page {pageNum}/3 - {title}</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString('fr-FR')}</Text>
            </View>
        </View>
    </View>
);

const Footer = ({ brand }: { brand?: PDFBrand | undefined }) => (
    <View style={styles.footer}>
        <Text style={styles.footerText}>
            Document genere par {brand?.agencyName || 'VALO SYNDIC'} - Simulation indicative basee sur les dispositions reglementaires 2026
        </Text>
        <Text style={styles.disclaimer}>
            Sous reserve d&apos;eligibilite des travaux et des ressources. Ne remplace pas un audit OPQIBI.
        </Text>
        <Text style={[styles.disclaimer, { marginTop: 4, fontSize: 6 }]}>
            Sources : DVF Etalab (prix), API Adresse data.gouv.fr (geo), ADEME (DPE), BDNB CSTB (bati)
        </Text>
    </View>
);

const Section = ({ title, children, borderColor = C.gold }: { title: string; children: React.ReactNode; borderColor?: string }) => (
    <View style={[styles.section, { borderLeftColor: borderColor }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const PropertySection = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[1] COPROPRIETE AUDITEE">
        <View style={styles.row}>
            <Text style={styles.label}>Adresse</Text>
            <Text style={styles.value}>
                {sanitizeText(result.input.address || '')} {result.input.postalCode} {sanitizeText(result.input.city || '')}
            </Text>
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>Localisation</Text>
            <Text style={styles.value}>{sanitizeText(result.input.city || '')} ({result.input.postalCode})</Text>
        </View>
        <View style={styles.rowNoBorder}>
            <Text style={styles.label}>Nombre de lots</Text>
            <Text style={styles.value}>{result.input.numberOfUnits}</Text>
        </View>
    </Section>
);

const DPESection = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[2] TRANSITION ENERGETIQUE" borderColor={getDPEColor(result.input.targetDPE)}>
        <View style={styles.dpeContainer}>
            <View style={{ alignItems: 'center' }}>
                <Text style={styles.dpeLabel}>Actuel</Text>
                <View style={[styles.dpeBox, { backgroundColor: getDPEColor(result.input.currentDPE) }]}>
                    <Text style={styles.dpeLetter}>{result.input.currentDPE}</Text>
                </View>
            </View>
            <Text style={styles.dpeArrow}>{'>'}</Text>
            <View style={{ alignItems: 'center' }}>
                <Text style={styles.dpeLabel}>Objectif</Text>
                <View style={[styles.dpeBox, { backgroundColor: getDPEColor(result.input.targetDPE) }]}>
                    <Text style={styles.dpeLetter}>{result.input.targetDPE}</Text>
                </View>
            </View>
        </View>
        <Text style={{ fontSize: 9, color: C.textMuted, textAlign: 'center' }}>
            Gain energetique estime : {formatPercent(result.financing.energyGainPercent)}
        </Text>
    </Section>
);

const UrgencySection = ({ result, urgency }: { result: DiagnosticResult; urgency: ReturnType<typeof getUrgencyInfo> }) => (
    <Section title="[3] SCORE D'URGENCE" borderColor={urgency.color}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Text style={[styles.bigNumber, { color: urgency.color }]}>
                {urgency.score}/100
            </Text>
            <View>
                <View style={[styles.badge, { backgroundColor: urgency.color + '20' }]}>
                    <Text style={[styles.badgeText, { color: urgency.color }]}>{urgency.label}</Text>
                </View>
                <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 6 }}>
                    {result.compliance.statusLabel}
                </Text>
            </View>
        </View>
    </Section>
);

const CalendarSection = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[4] CALENDRIER LOI CLIMAT">
        {result.compliance.prohibitionDate ? (
            <View>
                <Text style={{ fontSize: 11, color: C.danger, fontFamily: 'Helvetica-Bold' }}>
                    Interdiction de location : {result.compliance.prohibitionDate.toLocaleDateString('fr-FR')}
                </Text>
                <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 6 }}>
                    {result.compliance.daysUntilProhibition && result.compliance.daysUntilProhibition > 0
                        ? `Temps restant : ${Math.floor(result.compliance.daysUntilProhibition / 30)} mois`
                        : 'Interdiction deja en vigueur'}
                </Text>
            </View>
        ) : (
            <Text style={{ fontSize: 10, color: C.success }}>
                Classe {result.input.currentDPE} : Pas d&apos;interdiction prevue a ce jour
            </Text>
        )}
    </Section>
);

const MonthlyHero = ({ result }: { result: DiagnosticResult }) => {
    const avgTantiemesPerLot = 100;
    const monthlyPaymentFor100Tantiemes = (result.financing.ecoPtzAmount * (avgTantiemesPerLot / 1000)) / (20 * 12);

    return (
        <View style={[styles.heroBox, { backgroundColor: C.successLight, borderColor: C.success }]}>
            <Text style={[styles.heroLabel, { color: C.success }]}>Mensualite Eco-PTZ</Text>
            <Text style={[styles.bigNumber, { color: C.success }]}>
                {Math.round(monthlyPaymentFor100Tantiemes)} EUR
            </Text>
            <Text style={styles.heroValue}>
                par mois pour 100 tantiemes (10% d&apos;un lot standard)
            </Text>
            <Text style={{ fontSize: 8, color: C.textMuted, textAlign: 'center', marginTop: 4 }}>
                Duree : 20 ans - Taux : 0% - Aucun interet a payer
            </Text>
            {result.financing.remainingCost === 0 && (
                <Text style={{ fontSize: 10, color: C.success, fontFamily: 'Helvetica-Bold', marginTop: 10 }}>
                    [OK] 0 EUR d&apos;apport personnel requis
                </Text>
            )}
        </View>
    );
};

const FinancingTable = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[5] DETAIL DU FINANCEMENT">
        <View style={styles.table}>
            <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Poste</Text>
                <Text style={styles.tableHeaderCellRight}>Global</Text>
                <Text style={styles.tableHeaderCellRight}>Par lot</Text>
            </View>

            <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Cout total travaux HT</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(result.financing.totalCostHT)}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(result.financing.costPerUnit)}</Text>
            </View>

            <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { color: C.success }]}>MaPrimeRenov (subvention)</Text>
                <Text style={[styles.tableCellRight, { color: C.success }]}>-{formatCurrency(result.financing.mprAmount)}</Text>
                <Text style={[styles.tableCellRight, { color: C.success }]}>-{formatCurrency(result.financing.mprAmount / result.input.numberOfUnits)}</Text>
            </View>

            {result.financing.amoAmount > 0 && (
                <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { color: C.success }]}>Aide AMO</Text>
                    <Text style={[styles.tableCellRight, { color: C.success }]}>-{formatCurrency(result.financing.amoAmount)}</Text>
                    <Text style={[styles.tableCellRight, { color: C.success }]}>-{formatCurrency(result.financing.amoAmount / result.input.numberOfUnits)}</Text>
                </View>
            )}

            <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { color: C.gold }]}>Eco-PTZ (pret 0%)</Text>
                <Text style={[styles.tableCellRight, { color: C.gold }]}>{formatCurrency(result.financing.ecoPtzAmount)}</Text>
                <Text style={[styles.tableCellRight, { color: C.gold }]}>{formatCurrency(result.financing.ecoPtzAmount / result.input.numberOfUnits)}</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Reste a charge</Text>
                <Text style={[styles.tableCellRight, { fontFamily: 'Helvetica-Bold' }]}>{formatCurrency(result.financing.remainingCost)}</Text>
                <Text style={[styles.tableCellRight, { fontFamily: 'Helvetica-Bold' }]}>{formatCurrency(result.financing.remainingCostPerUnit)}</Text>
            </View>
        </View>
    </Section>
);

const FinancingBreakdown = ({ result }: { result: DiagnosticResult }) => {
    const totalCost = result.financing.totalCostHT;
    const mprPercent = Math.round((result.financing.mprAmount / totalCost) * 100);
    const ptzPercent = Math.round((result.financing.ecoPtzAmount / totalCost) * 100);
    const remainingPercent = Math.round((result.financing.remainingCost / totalCost) * 100);

    return (
        <Section title="[6] REPARTITION DES FINANCEMENTS">
            <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 8, color: C.textSecondary, marginBottom: 4 }}>MaPrimeRenov (subvention)</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${mprPercent}%`, backgroundColor: C.success }]} />
                </View>
                <Text style={styles.progressLabel}>{mprPercent}% - {formatCurrency(result.financing.mprAmount)}</Text>

                <Text style={{ fontSize: 8, color: C.textSecondary, marginBottom: 4, marginTop: 10 }}>Eco-PTZ (pret sans interet)</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${ptzPercent}%`, backgroundColor: C.gold }]} />
                </View>
                <Text style={styles.progressLabel}>{ptzPercent}% - {formatCurrency(result.financing.ecoPtzAmount)}</Text>

                {result.financing.remainingCost > 0 && (
                    <>
                        <Text style={{ fontSize: 8, color: C.textSecondary, marginBottom: 4, marginTop: 10 }}>Reste a charge (apport)</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${remainingPercent}%`, backgroundColor: C.textMuted }]} />
                        </View>
                        <Text style={styles.progressLabel}>{remainingPercent}% - {formatCurrency(result.financing.remainingCost)}</Text>
                    </>
                )}
            </View>

            <Text style={styles.methodology}>
                Note : L&apos;Eco-PTZ est un pret a rembourser sur 20 ans, tandis que MaPrimeRenov est une subvention. La somme peut depasser 100% du cout (surcouverture).
            </Text>
        </Section>
    );
};

const InactionCostSection = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[7] COUT DE L'INACTION (3 ANS)" borderColor={C.danger}>
        <View style={{ backgroundColor: C.dangerLight, padding: 10, borderRadius: 4 }}>
            <Text style={[styles.bigNumber, { color: C.danger, fontSize: 24 }]}>
                {formatCurrency(result.inactionCost.totalInactionCost)}
            </Text>
            <Text style={{ fontSize: 9, color: C.textSecondary, marginBottom: 10 }}>
                Ce que vous perdez en attendant
            </Text>

            <View style={styles.rowNoBorder}>
                <Text style={styles.label}>Inflation BTP (+4.5%/an)</Text>
                <Text style={[styles.value, { color: C.danger }]}>
                    +{formatCurrency(result.inactionCost.projectedCost3Years - result.inactionCost.currentCost)}
                </Text>
            </View>

            {result.inactionCost.valueDepreciation > 0 && (
                <View style={styles.rowNoBorder}>
                    <Text style={styles.label}>Decote valeur verte</Text>
                    <Text style={[styles.value, { color: C.danger }]}>
                        -{formatCurrency(result.inactionCost.valueDepreciation)}
                    </Text>
                </View>
            )}
        </View>
    </Section>
);

const ValuationSection = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[8] GAIN DE VALEUR VERTE" borderColor={C.success}>
        <View style={{ backgroundColor: C.successLight, padding: 10, borderRadius: 4 }}>
            <Text style={[styles.bigNumber, { color: C.success, fontSize: 24 }]}>
                +{formatCurrency(result.valuation.greenValueGain)}
            </Text>
            <Text style={{ fontSize: 9, color: C.textSecondary, marginBottom: 8 }}>
                Plus-value estimee ({formatPercent(result.valuation.greenValueGainPercent)})
            </Text>

            <View style={styles.rowNoBorder}>
                <Text style={styles.label}>Valeur actuelle estimee</Text>
                <Text style={styles.value}>{formatCurrency(result.valuation.currentValue)}</Text>
            </View>
            <View style={styles.rowNoBorder}>
                <Text style={styles.label}>Valeur apres renovation</Text>
                <Text style={[styles.value, { color: C.success }]}>{formatCurrency(result.valuation.projectedValue)}</Text>
            </View>
        </View>

        <Text style={styles.methodology}>
            Methode : Ecart de valeur entre passoire thermique (-12%) vs bien renove classe C (donnees Notaires France, zone Angers/Nantes).
        </Text>
    </Section>
);

const ROISection = ({ result }: { result: DiagnosticResult }) => {
    const isPositive = result.valuation.netROI >= 0;
    return (
        <View style={[styles.heroBox, {
            backgroundColor: isPositive ? C.successLight : C.dangerLight,
            borderColor: isPositive ? C.success : C.danger
        }]}>
            <Text style={[styles.heroLabel, { color: isPositive ? C.success : C.danger }]}>
                Retour sur Investissement Net
            </Text>
            <Text style={[styles.bigNumber, { color: isPositive ? C.success : C.danger }]}>
                {isPositive ? '+' : ''}{formatCurrency(result.valuation.netROI)}
            </Text>
            <Text style={styles.heroValue}>
                Gain de valeur - Reste a charge = Benefice net
            </Text>
        </View>
    );
};

const AGPhraseSection = () => (
    <View style={styles.quote}>
        <Text style={styles.quoteText}>
            &quot;En votant cette resolution aujourd&apos;hui, vous securisez la valeur locative de vos biens et beneficiez d&apos;aides qui ne seront plus disponibles demain. C&apos;est un investissement patrimonial, pas une depense.&quot;
        </Text>
        <Text style={styles.quoteSource}>
            -- Phrase cle pour l&apos;Assemblee Generale
        </Text>
    </View>
);

// =============================================================================
// 6. MAIN DOCUMENT
// =============================================================================

export const PDFDocument = ({ result, brand }: PDFDocumentProps) => {
    const urgency = getUrgencyInfo(result.compliance, result.input.currentDPE);

    return (
        <Document>
            {/* PAGE 1: DIAGNOSTIC */}
            <Page size="A4" style={styles.page}>
                <Header pageNum={1} title="Diagnostic" brand={brand} />

                <View style={styles.content}>
                    <Text style={styles.pageTitle}>Diagnostic Energetique</Text>

                    <PropertySection result={result} />
                    <DPESection result={result} />
                    <UrgencySection result={result} urgency={urgency} />
                    <CalendarSection result={result} />
                </View>

                <Footer brand={brand} />
            </Page>

            {/* PAGE 2: FINANCEMENT */}
            <Page size="A4" style={styles.page}>
                <Header pageNum={2} title="Plan de Financement" brand={brand} />

                <View style={styles.content}>
                    <Text style={styles.pageTitle}>Solution financière</Text>

                    <MonthlyHero result={result} />

                    <View style={styles.callout}>
                        <Text style={[styles.calloutText, { color: '#92400E' }]}>
                            Le montant varie selon vos tantiemes. Un lot de 100 tantiemes paiera environ {Math.round((result.financing.ecoPtzAmount * (100 / 1000)) / (20 * 12))}EUR/mois, soit moins qu&apos;un abonnement telecom.
                        </Text>
                    </View>

                    <FinancingTable result={result} />
                    <FinancingBreakdown result={result} />
                </View>

                <Footer brand={brand} />
            </Page>

            {/* PAGE 3: ARGUMENTAIRE */}
            <Page size="A4" style={styles.page}>
                <Header pageNum={3} title="Strategie Patrimoniale" brand={brand} />

                <View style={styles.content}>
                    <Text style={styles.pageTitle}>Argumentaire décisionnel</Text>

                    <View style={styles.twoColumn}>
                        <View style={styles.column}>
                            <InactionCostSection result={result} />
                        </View>
                        <View style={styles.column}>
                            <ValuationSection result={result} />
                        </View>
                    </View>

                    <ROISection result={result} />
                    <AGPhraseSection />
                </View>

                <Footer brand={brand} />
            </Page>
        </Document>
    );
};

export default PDFDocument;
