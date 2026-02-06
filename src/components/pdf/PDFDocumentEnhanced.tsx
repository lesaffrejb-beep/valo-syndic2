/**
 * VALO-SYNDIC — PDF Document Enhanced (Profile-Aware)
 * ==================================================
 * 
 * Version enrichie du PDF qui adapte le contenu selon:
 * 1. Le profil du coproprietaire cible
 * 2. Les caracteristiques de la copropriete
 * 3. L urgence reglementaire
 * 
 * Features:
 * - Content sections dynamiques
 * - Arguments priorises selon le profil
 * - Wording personnalise
 * - Multi-profile support (page supplementaire)
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { type DiagnosticResult } from '@/lib/schemas';
import { formatCurrency, formatPercent, sanitizeText } from '@/lib/calculator';
import {
    type OwnerProfile,
    type OwnerProfileType,
    OWNER_PROFILES,
    getRelevantProfiles,
    getWordingForProfile
} from '@/lib/pdf-profiles';

// =============================================================================
// 1. THEME & DESIGN SYSTEM
// =============================================================================

const C = {
    primary: '#1E3A5F',
    primaryLight: '#2D4A6F',
    gold: '#B8860B',
    goldLight: '#D4AF37',
    bg: '#FFFFFF',
    bgSection: '#F8F9FA',
    bgHighlight: '#FFF9E6',
    bgProfile: '#F0F4F8',
    text: '#1A1A2E',
    textSecondary: '#4A5568',
    textMuted: '#718096',
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    border: '#E2E8F0',
    borderLight: '#EDF2F7',
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
    },

    headerBand: {
        height: 6,
        backgroundColor: C.gold,
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
        fontSize: 20,
        fontFamily: 'Helvetica-Bold',
        color: C.primary,
        letterSpacing: 0.5,
    },

    brandSubtitle: {
        fontSize: 9,
        color: C.textMuted,
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
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
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        marginBottom: 16,
    },

    section: {
        marginBottom: 28,
        padding: 12,
        backgroundColor: C.bgSection,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: C.gold,
    },

    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
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
        fontSize: 10,
        color: C.text,
        fontStyle: 'italic',
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

    // Profile-specific styles
    profileCard: {
        backgroundColor: C.bgProfile,
        padding: 10,
        borderRadius: 4,
        marginBottom: 8,
    },

    profileName: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: C.primary,
    },

    profileDetail: {
        fontSize: 8,
        color: C.textSecondary,
        marginTop: 2,
    },

    argumentList: {
        marginTop: 6,
    },

    argumentItem: {
        fontSize: 8,
        color: C.text,
        marginBottom: 3,
    },

    priorityTag: {
        fontSize: 7,
        color: C.gold,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        marginTop: 4,
    },
});

// =============================================================================
// 3. TYPES
// =============================================================================

interface PDFBrand {
    agencyName?: string;
    primaryColor?: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
}

interface PDFDocumentEnhancedProps {
    result: DiagnosticResult;
    brand?: PDFBrand | undefined;
    targetProfile?: OwnerProfileType | undefined;
    showAllProfiles?: boolean;
}

// =============================================================================
// 4. HELPER FUNCTIONS
// =============================================================================

const getDPEColor = (dpe: string): string => {
    const colors: Record<string, string> = {
        G: '#DC2626', F: '#EA580C', E: '#D97706',
        D: '#EAB308', C: '#84CC16', B: '#22C55E', A: '#059669',
    };
    return colors[dpe] || C.text;
};

const getUrgencyInfo = (compliance: DiagnosticResult['compliance']) => {
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
// 5. COMPONENT SECTIONS
// =============================================================================

const Header = ({ pageNum, title, brand, totalPages = 4 }: {
    pageNum: number;
    title: string;
    brand?: PDFBrand | undefined;
    totalPages?: number;
}) => (
    <View>
        <View style={[styles.headerBand, { backgroundColor: brand?.primaryColor || C.gold }]} />
        <View style={styles.header}>
            <View>
                <Text style={styles.brandTitle}>{brand?.agencyName || 'VALO SYNDIC'}</Text>
                <Text style={styles.brandSubtitle}>Audit Patrimonial & Financier</Text>
            </View>
            <View style={styles.headerMeta}>
                <Text style={styles.pageIndicator}>Page {pageNum}/{totalPages} - {title}</Text>
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
            Sous reserve d elgibilite des travaux et des ressources. Ne remplace pas un audit OPQIBI.
        </Text>
    </View>
);

const Section = ({ title, children, borderColor = C.gold }: {
    title: string;
    children: React.ReactNode;
    borderColor?: string;
}) => (
    <View style={[styles.section, { borderLeftColor: borderColor }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const ProfileHook = ({ profile, wording }: { profile: OwnerProfile; wording: OwnerProfile['pdfWording'] }) => (
    <View style={[styles.heroBox, { backgroundColor: C.bgHighlight, borderColor: C.gold }]}>
        <Text style={[styles.heroLabel, { color: C.gold }]}>
            Argument adapté à votre profil : {profile.name}
        </Text>
        <Text style={{ fontSize: 12, color: C.text, textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>
            {wording.hook}
        </Text>
    </View>
);

const PropertySection = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[1] Copropriété auditée">
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
            <Text style={styles.dpeArrow}>--{'>'}</Text>
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

const MonthlyHero = ({ result, wording }: { result: DiagnosticResult; wording?: OwnerProfile['pdfWording'] | undefined }) => {
    const avgTantiemesPerLot = 100;
    const monthlyPaymentFor100Tantiemes = (result.financing.ecoPtzAmount * (avgTantiemesPerLot / 1000)) / (20 * 12);

    return (
        <View style={[styles.heroBox, { backgroundColor: C.successLight, borderColor: C.success }]}>
            <Text style={[styles.heroLabel, { color: C.success }]}>
                {wording?.monthlyFocus || 'Mensualite Eco-PTZ'}
            </Text>
            <Text style={[styles.bigNumber, { color: C.success }]}>
                {Math.round(monthlyPaymentFor100Tantiemes)} EUR
            </Text>
            <Text style={styles.heroValue}>
                par mois pour 100 tantiemes (10% d un lot standard)
            </Text>
            <Text style={{ fontSize: 8, color: C.textMuted, textAlign: 'center', marginTop: 4 }}>
                Duree : 20 ans - Taux : 0% - Aucun interet a payer
            </Text>
            {result.financing.remainingCost === 0 && (
                <Text style={{ fontSize: 10, color: C.success, fontFamily: 'Helvetica-Bold', marginTop: 10 }}>
                    [OK] 0 EUR d apport personnel requis
                </Text>
            )}
        </View>
    );
};

const FinancingTable = ({ result }: { result: DiagnosticResult }) => (
    <Section title="[3] DETAIL DU FINANCEMENT">
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

const InactionSection = ({ result, wording }: { result: DiagnosticResult; wording?: OwnerProfile['pdfWording'] | undefined }) => (
    <Section title="[4] COUT DE L'INACTION" borderColor={C.danger}>
        {wording?.riskFocus && (
            <View style={{ backgroundColor: C.warningLight, padding: 8, borderRadius: 4, marginBottom: 10 }}>
                <Text style={{ fontSize: 9, color: '#92400E', fontStyle: 'italic' }}>
                    {wording.riskFocus}
                </Text>
            </View>
        )}
        <View style={{ backgroundColor: C.dangerLight, padding: 10, borderRadius: 4 }}>
            <Text style={[styles.bigNumber, { color: C.danger, fontSize: 24 }]}>
                {formatCurrency(result.inactionCost.totalInactionCost)}
            </Text>
            <Text style={{ fontSize: 9, color: C.textSecondary, marginBottom: 10 }}>
                Perte totale sur 3 ans si vous attendez
            </Text>
            <View style={styles.rowNoBorder}>
                <Text style={styles.label}>Inflation BTP (+4.5%/an)</Text>
                <Text style={[styles.value, { color: C.danger }]}>
                    +{formatCurrency(result.inactionCost.projectedCost3Years - result.inactionCost.currentCost)}
                </Text>
            </View>
        </View>
    </Section>
);

const ValuationSection = ({ result, wording }: { result: DiagnosticResult; wording?: OwnerProfile['pdfWording'] | undefined }) => (
    <Section title="[5] GAIN DE VALEUR VERTE" borderColor={C.success}>
        {wording?.benefitFocus && (
            <View style={{ backgroundColor: C.successLight, padding: 8, borderRadius: 4, marginBottom: 10 }}>
                <Text style={{ fontSize: 9, color: C.success, fontStyle: 'italic' }}>
                    {wording.benefitFocus}
                </Text>
            </View>
        )}
        <View style={{ backgroundColor: C.successLight, padding: 10, borderRadius: 4 }}>
            <Text style={[styles.bigNumber, { color: C.success, fontSize: 24 }]}>
                +{formatCurrency(result.valuation.greenValueGain)}
            </Text>
            <Text style={{ fontSize: 9, color: C.textSecondary, marginBottom: 8 }}>
                Plus-value estimee ({formatPercent(result.valuation.greenValueGainPercent)})
            </Text>
            <View style={styles.rowNoBorder}>
                <Text style={styles.label}>Valeur actuelle</Text>
                <Text style={styles.value}>{formatCurrency(result.valuation.currentValue)}</Text>
            </View>
            <View style={styles.rowNoBorder}>
                <Text style={styles.label}>Valeur apres renovation</Text>
                <Text style={[styles.value, { color: C.success }]}>{formatCurrency(result.valuation.projectedValue)}</Text>
            </View>
        </View>
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

const ProfileLeversSection = ({ profile }: { profile: OwnerProfile }) => (
    <Section title={`[6] ARGUMENTS POUR ${profile.name.toUpperCase()}`} borderColor={C.primary}>
        <View style={styles.twoColumn}>
            <View style={styles.column}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.success, marginBottom: 6 }}>
                    Leviers Financiers
                </Text>
                {profile.levers.financial.slice(0, 2).map((lever, i) => (
                    <Text key={i} style={styles.argumentItem}>- {lever}</Text>
                ))}
            </View>
            <View style={styles.column}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.primary, marginBottom: 6 }}>
                    Leviers Pratiques
                </Text>
                {profile.levers.practical.slice(0, 2).map((lever, i) => (
                    <Text key={i} style={styles.argumentItem}>- {lever}</Text>
                ))}
            </View>
        </View>
    </Section>
);

const AllProfilesSection = () => {
    const profiles = Object.values(OWNER_PROFILES).slice(0, 5);

    return (
        <Section title="[6] PROFILS DE COPROPRIETAIRES" borderColor={C.primary}>
            <Text style={{ fontSize: 9, color: C.textSecondary, marginBottom: 10 }}>
                Ce document s adapte aux principaux profils rencontres en AG :
            </Text>
            {profiles.map((profile, i) => (
                <View key={profile.id} style={styles.profileCard}>
                    <Text style={styles.profileName}>{i + 1}. {profile.name} ({profile.age} ans)</Text>
                    <Text style={styles.profileDetail}>{profile.situation}</Text>
                    <Text style={styles.priorityTag}>Objection principale : {profile.mainFear}</Text>
                </View>
            ))}
            <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 8, fontStyle: 'italic' }}>
                Et 5 autres profils disponibles sur demande...
            </Text>
        </Section>
    );
};

const AGPhraseSection = ({ wording }: { wording?: OwnerProfile['pdfWording'] | undefined }) => (
    <View style={styles.quote}>
        <Text style={styles.quoteText}>
            &quot;{wording?.ctaPhrase || 'En votant cette resolution aujourd hui, vous securisez la valeur locative de vos biens et beneficiez d aides qui ne seront plus disponibles demain. C est un investissement patrimonial, pas une depense.'}&quot;
        </Text>
        <Text style={styles.quoteSource}>
            -- Phrase cle pour l Assemblee Generale
        </Text>
    </View>
);

// =============================================================================
// 6. MAIN DOCUMENT
// =============================================================================

export const PDFDocumentEnhanced = ({
    result,
    brand,
    targetProfile,
    showAllProfiles = true
}: PDFDocumentEnhancedProps) => {
    const urgency = getUrgencyInfo(result.compliance);
    const profile = targetProfile ? OWNER_PROFILES[targetProfile] : undefined;
    const wording = profile ? getWordingForProfile(profile, result) : undefined;

    return (
        <Document>
            {/* PAGE 1: DIAGNOSTIC PERSONNALISE */}
            <Page size="A4" style={styles.page}>
                <Header pageNum={1} title="Diagnostic" brand={brand} />

                <View style={styles.content}>
                    <Text style={styles.pageTitle}>Diagnostic énergétique</Text>

                    {profile && wording && (
                        <ProfileHook profile={profile} wording={wording} />
                    )}

                    <PropertySection result={result} />
                    <DPESection result={result} />
                </View>

                <Footer brand={brand} />
            </Page>

            {/* PAGE 2: FINANCEMENT */}
            <Page size="A4" style={styles.page}>
                <Header pageNum={2} title="Plan de Financement" brand={brand} />

                <View style={styles.content}>
                    <Text style={styles.pageTitle}>Solution financière</Text>

                    <MonthlyHero result={result} wording={wording} />
                    <FinancingTable result={result} />
                </View>

                <Footer brand={brand} />
            </Page>

            {/* PAGE 3: ARGUMENTAIRE PERSONNALISE */}
            <Page size="A4" style={styles.page}>
                <Header pageNum={3} title="Strategie Patrimoniale" brand={brand} />

                <View style={styles.content}>
                    <Text style={styles.pageTitle}>Argumentaire décisionnel</Text>

                    <View style={styles.twoColumn}>
                        <View style={styles.column}>
                            <InactionSection result={result} wording={wording} />
                        </View>
                        <View style={styles.column}>
                            <ValuationSection result={result} wording={wording} />
                        </View>
                    </View>

                    <ROISection result={result} />

                    {profile && <ProfileLeversSection profile={profile} />}

                    <AGPhraseSection wording={wording} />
                </View>

                <Footer brand={brand} />
            </Page>


        </Document>
    );
};

export default PDFDocumentEnhanced;
