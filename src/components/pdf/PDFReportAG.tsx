/**
 * VALO-SYNDIC — PDF Report AG (Assembly General Ready)
 * =====================================================
 * Professional PDF report for formal AG presentations.
 * Strict "Banker/Notary" style: white background, clean typography, printable.
 * 
 * Structure (3 pages):
 * - Page 1: Executive Summary (Address, DPE transition, Key KPIs)
 * - Page 2: Global Financing (The Vote - Total costs, subsidies, net financing)
 * - Page 3: Profile Matrix (The critical table showing 4 standard profiles)
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { DiagnosticResult } from '@/lib/schemas';
import { formatCurrency, formatPercent, sanitizeText } from '@/lib/calculator';
import { generateProfileMatrix, type ProfileMatrixRow } from '@/lib/pdf-profiles-matrix';

// =============================================================================
// DESIGN SYSTEM — AG PROFESSIONAL
// =============================================================================

const COLORS = {
    // Primary palette (conservative banker/notary style)
    primary: '#1E3A5F',        // Deep navy blue
    gold: '#B8860B',           // Muted gold for accents
    background: '#FFFFFF',      // Pure white (printable)

    // Typography
    text: '#000000',           // Pure black for maximum legibility
    textSecondary: '#4A5568',  // Dark gray for secondary info
    textMuted: '#718096',      // Light gray for footnotes

    // Status colors (high contrast for printing)
    success: '#047857',        // Dark green (energy gain)
    danger: '#DC2626',         // Red (urgency)

    // Borders and dividers
    border: '#E5E7EB',         // Light gray border
    borderDark: '#9CA3AF',     // Darker border for emphasis
} as const;

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    // --- Page Layout ---
    page: {
        flexDirection: 'column',
        backgroundColor: COLORS.background,
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: COLORS.text,
    },

    // --- Header ---
    header: {
        marginBottom: 24,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.gold,
    },

    headerTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.primary,
        marginBottom: 4,
    },

    headerSubtitle: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },

    headerDate: {
        fontSize: 8,
        color: COLORS.textMuted,
        marginTop: 4,
    },

    // --- Sections ---
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.primary,
        marginTop: 20,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    sectionSubtitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 6,
    },

    // --- DPE Boxes ---
    dpeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
    },

    dpeBox: {
        width: 70,
        height: 70,
        borderRadius: 4,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },

    dpeLetter: {
        fontSize: 36,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.text,
    },

    dpeLabel: {
        fontSize: 9,
        color: COLORS.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },

    dpeArrow: {
        fontSize: 24,
        color: COLORS.success,
        marginHorizontal: 20,
        fontFamily: 'Helvetica-Bold',
    },

    // --- Key Figures (Hero Numbers) ---
    heroBox: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginVertical: 12,
        alignItems: 'center',
    },

    heroLabel: {
        fontSize: 9,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },

    heroValue: {
        fontSize: 32,
        fontFamily: 'Helvetica-Bold',
        color: COLORS.primary,
    },

    heroUnit: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 6,
    },

    // --- Tables ---
    table: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    tableHeader: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },

    tableHeaderCell: {
        flex: 1,
        fontSize: 9,
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },

    tableHeaderCellRight: {
        flex: 1,
        fontSize: 9,
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'right',
        textTransform: 'uppercase',
    },

    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },

    tableRowLast: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 8,
    },

    tableCell: {
        flex: 1,
        fontSize: 9,
        color: COLORS.text,
    },

    tableCellBold: {
        flex: 1,
        fontSize: 9,
        color: COLORS.text,
        fontFamily: 'Helvetica-Bold',
    },

    tableCellRight: {
        flex: 1,
        fontSize: 9,
        color: COLORS.text,
        textAlign: 'right',
    },

    tableCellRightBold: {
        flex: 1,
        fontSize: 9,
        color: COLORS.text,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'right',
    },

    // --- Data Rows (Key-Value pairs) ---
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.border,
    },

    dataLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },

    dataValue: {
        fontSize: 10,
        color: COLORS.text,
        fontFamily: 'Helvetica-Bold',
    },

    // --- Callouts ---
    callout: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.gold,
        marginVertical: 12,
    },

    calloutText: {
        fontSize: 9,
        color: '#78350F',
        lineHeight: 1.4,
    },

    // --- Footer ---
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        paddingTop: 8,
        borderTopWidth: 0.5,
        borderTopColor: COLORS.border,
    },

    footerText: {
        fontSize: 7,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 1.3,
    },

    // --- Page Numbers ---
    pageNumber: {
        position: 'absolute',
        bottom: 15,
        right: 40,
        fontSize: 8,
        color: COLORS.textMuted,
    },
});

// =============================================================================
// COMPONENTS
// =============================================================================

const Header = ({ title, address, date }: { title: string; address?: string; date: string }) => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>VALO SYNDIC — Audit & Financement</Text>
        <Text style={styles.headerSubtitle}>{title}</Text>
        {address && <Text style={styles.headerSubtitle}>{sanitizeText(address)}</Text>}
        <Text style={styles.headerDate}>Document genere le {date}</Text>
    </View>
);

const Footer = ({ pageNum }: { pageNum: number }) => (
    <>
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Document indicatif base sur les dispositions reglementaires 2026 - Sous reserve d&apos;eligibilite
            </Text>
        </View>
        <Text style={styles.pageNumber}>Page {pageNum}/3</Text>
    </>
);

const DPETransition = ({ currentDPE, targetDPE, gainPercent }: {
    currentDPE: string;
    targetDPE: string;
    gainPercent: number;
}) => (
    <View>
        <Text style={styles.sectionSubtitle}>Performance Energetique</Text>
        <View style={styles.dpeContainer}>
            <View style={{ alignItems: 'center' }}>
                <View style={[styles.dpeBox, { borderColor: COLORS.danger }]}>
                    <Text style={styles.dpeLetter}>{currentDPE}</Text>
                </View>
                <Text style={styles.dpeLabel}>Actuel</Text>
            </View>
            <Text style={styles.dpeArrow}>→</Text>
            <View style={{ alignItems: 'center' }}>
                <View style={[styles.dpeBox, { borderColor: COLORS.success }]}>
                    <Text style={styles.dpeLetter}>{targetDPE}</Text>
                </View>
                <Text style={styles.dpeLabel}>Objectif</Text>
            </View>
        </View>
        <Text style={{ fontSize: 9, color: COLORS.textSecondary, textAlign: 'center' }}>
            Gain energetique estime : {formatPercent(gainPercent)}
        </Text>
    </View>
);

const ProfileMatrixTable = ({ profiles }: { profiles: ProfileMatrixRow[] }) => (
    <View style={styles.table}>
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Type</Text>
            <Text style={[styles.tableHeaderCellRight, { flex: 1 }]}>Tantiemes</Text>
            <Text style={[styles.tableHeaderCellRight, { flex: 1.2 }]}>Quote-part</Text>
            <Text style={[styles.tableHeaderCellRight, { flex: 1.2 }]}>Aides Est.</Text>
            <Text style={[styles.tableHeaderCellRight, { flex: 1.3 }]}>Mensualite</Text>
        </View>
        {profiles.map((profile, index) => {
            const isLast = index === profiles.length - 1;
            return (
                <View key={profile.type} style={isLast ? styles.tableRowLast : styles.tableRow}>
                    <Text style={[styles.tableCellBold, { flex: 0.8 }]}>{profile.type}</Text>
                    <Text style={[styles.tableCellRight, { flex: 1 }]}>{profile.tantiemes}/1000</Text>
                    <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{formatCurrency(profile.quotePart)}</Text>
                    <Text style={[styles.tableCellRight, { flex: 1.2 }]}>{formatCurrency(profile.aids)}</Text>
                    <Text style={[styles.tableCellRightBold, { flex: 1.3 }]}>{formatCurrency(profile.monthly)}/mois</Text>
                </View>
            );
        })}
    </View>
);

// =============================================================================
// MAIN DOCUMENT
// =============================================================================

interface PDFReportAGProps {
    result: DiagnosticResult;
    brand?: {
        agencyName?: string;
        primaryColor?: string;
    };
}

export const PDFReportAG = ({ result }: PDFReportAGProps) => {
    const address = result.input.address
        ? `${result.input.address}, ${result.input.postalCode} ${result.input.city}`
        : `${result.input.postalCode} ${result.input.city}`;

    const date = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const profiles = generateProfileMatrix(result.financing, result.input.numberOfUnits);

    // Calculate total subsidies
    const totalSubsidies =
        result.financing.mprAmount +
        result.financing.ceeAmount +
        result.financing.localAidAmount +
        result.financing.amoAmount;

    // Calculate approximate annual energy savings
    const annualSavings = result.financing.monthlyEnergySavings * 12;

    return (
        <Document>
            {/* PAGE 1: EXECUTIVE SUMMARY */}
            <Page size="A4" style={styles.page}>
                <Header
                    title="SYNTHESE EXECUTIF"
                    address={address}
                    date={date}
                />

                <Text style={styles.sectionTitle}>1. Projet</Text>
                <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Adresse</Text>
                    <Text style={styles.dataValue}>{sanitizeText(address)}</Text>
                </View>
                <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Nombre de lots</Text>
                    <Text style={styles.dataValue}>{result.input.numberOfUnits} logements</Text>
                </View>

                <DPETransition
                    currentDPE={result.input.currentDPE}
                    targetDPE={result.input.targetDPE}
                    gainPercent={result.financing.energyGainPercent}
                />

                <Text style={styles.sectionTitle}>2. Chiffres Cles</Text>

                <View style={styles.heroBox}>
                    <Text style={styles.heroLabel}>Economies Energetiques</Text>
                    <Text style={styles.heroValue}>{formatCurrency(annualSavings)}</Text>
                    <Text style={styles.heroUnit}>par an pour l&apos;immeuble</Text>
                </View>

                <View style={styles.callout}>
                    <Text style={styles.calloutText}>
                        Ce projet permet de realiser {formatPercent(result.financing.energyGainPercent)} d&apos;economie d&apos;energie
                        tout en augmentant la valeur patrimoniale de {formatCurrency(result.valuation.greenValueGain)}.
                    </Text>
                </View>

                <Footer pageNum={1} />
            </Page>

            {/* PAGE 2: GLOBAL FINANCING (THE VOTE) */}
            <Page size="A4" style={styles.page}>
                <Header
                    title="PLAN DE FINANCEMENT GLOBAL"
                    address={address}
                    date={date}
                />

                <Text style={styles.sectionTitle}>3. Detail du Financement</Text>
                <Text style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 12 }}>
                    Vote de l&apos;Assemblee Generale - Montants collectifs
                </Text>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderCell}>Poste</Text>
                        <Text style={styles.tableHeaderCellRight}>Montant</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Cout total travaux HT</Text>
                        <Text style={styles.tableCellRight}>{formatCurrency(result.financing.totalCostHT)}</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Cout total travaux TTC (TVA 5.5%)</Text>
                        <Text style={styles.tableCellRightBold}>{formatCurrency(result.financing.totalCostTTC)}</Text>
                    </View>

                    <View style={[styles.tableRow, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={styles.tableCell}>MaPrimeRenov&apos; Copropriete</Text>
                        <Text style={[styles.tableCellRightBold, { color: COLORS.success }]}>
                            -{formatCurrency(result.financing.mprAmount)}
                        </Text>
                    </View>

                    <View style={[styles.tableRow, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={styles.tableCell}>Certificats Economie Energie (CEE)</Text>
                        <Text style={[styles.tableCellRightBold, { color: COLORS.success }]}>
                            -{formatCurrency(result.financing.ceeAmount)}
                        </Text>
                    </View>

                    {result.financing.amoAmount > 0 && (
                        <View style={[styles.tableRow, { backgroundColor: '#ECFDF5' }]}>
                            <Text style={styles.tableCell}>Aide AMO (Ingenierie)</Text>
                            <Text style={[styles.tableCellRightBold, { color: COLORS.success }]}>
                                -{formatCurrency(result.financing.amoAmount)}
                            </Text>
                        </View>
                    )}

                    {result.financing.localAidAmount > 0 && (
                        <View style={[styles.tableRow, { backgroundColor: '#ECFDF5' }]}>
                            <Text style={styles.tableCell}>Aides Locales</Text>
                            <Text style={[styles.tableCellRightBold, { color: COLORS.success }]}>
                                -{formatCurrency(result.financing.localAidAmount)}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.tableRow, { borderBottomWidth: 2, borderBottomColor: COLORS.borderDark }]}>
                        <Text style={styles.tableCellBold}>Total Subventions</Text>
                        <Text style={[styles.tableCellRightBold, { color: COLORS.success, fontSize: 11 }]}>
                            -{formatCurrency(totalSubsidies)}
                        </Text>
                    </View>

                    <View style={[styles.tableRow, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={styles.tableCellBold}>Reste a Financer</Text>
                        <Text style={[styles.tableCellRightBold, { fontSize: 11 }]}>
                            {formatCurrency(result.financing.ecoPtzAmount + result.financing.remainingCost)}
                        </Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Eco-PTZ Collectif (Pret 0%, 20 ans)</Text>
                        <Text style={styles.tableCellRight}>{formatCurrency(result.financing.ecoPtzAmount)}</Text>
                    </View>

                    <View style={styles.tableRowLast}>
                        <Text style={styles.tableCellBold}>Apport Cash (si necessaire)</Text>
                        <Text style={styles.tableCellRightBold}>{formatCurrency(result.financing.remainingCost)}</Text>
                    </View>
                </View>

                <View style={[styles.callout, { marginTop: 20 }]}>
                    <Text style={styles.calloutText}>
                        INFORMATION IMPORTANTE : L&apos;Eco-PTZ est un pret garanti par l&apos;Etat a TAUX ZERO.
                        Aucun interet a payer pendant 20 ans. Mensualite fixe calculee sur la page suivante.
                    </Text>
                </View>

                <Footer pageNum={2} />
            </Page>

            {/* PAGE 3: PROFILE MATRIX (THE CRITICAL TABLE) */}
            <Page size="A4" style={styles.page}>
                <Header
                    title="TABLEAU DECISIONNEL PAR PROFIL"
                    address={address}
                    date={date}
                />

                <Text style={styles.sectionTitle}>4. La Matrice — Impact par Type de Lot</Text>
                <Text style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 16 }}>
                    Simulation pour 4 profils types - Mensualites Eco-PTZ sur 20 ans a 0%
                </Text>

                <ProfileMatrixTable profiles={profiles} />

                <View style={[styles.callout, { marginTop: 16 }]}>
                    <Text style={[styles.calloutText, { fontFamily: 'Helvetica-Bold', marginBottom: 4 }]}>
                        Comment lire ce tableau :
                    </Text>
                    <Text style={styles.calloutText}>
                        • Tantiemes : Quote-part de propriete (ex: 100/1000 = 10% de l&apos;immeuble)
                    </Text>
                    <Text style={styles.calloutText}>
                        • Quote-part : Part des travaux correspondant a votre lot
                    </Text>
                    <Text style={styles.calloutText}>
                        • Aides Est. : Aides publiques deduites (subventions directes)
                    </Text>
                    <Text style={styles.calloutText}>
                        • Mensualite : Paiement mensuel sur 20 ans (SANS INTERET)
                    </Text>
                </View>

                <View style={{ marginTop: 20, padding: 12, backgroundColor: '#ECFDF5', borderRadius: 4 }}>
                    <Text style={[styles.sectionSubtitle, { marginTop: 0, color: COLORS.success }]}>
                        Exemple concret (T2 Standard - 100 tantiemes) :
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.text, lineHeight: 1.5, marginTop: 6 }}>
                        Travaux : {formatCurrency(profiles[1]?.quotePart || 0)} → Aides : {formatCurrency(profiles[1]?.aids || 0)}
                        {' '}→ Pret 0% : {formatCurrency((profiles[1]?.quotePart || 0) - (profiles[1]?.aids || 0))}
                        {' '}→ Mensualite : {formatCurrency(profiles[1]?.monthly || 0)}/mois pendant 20 ans
                    </Text>
                    <Text style={{ fontSize: 9, color: COLORS.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
                        Avec les economies d&apos;energie ({formatCurrency(result.financing.monthlyEnergySavings)}/mois estimees),
                        l&apos;effort reel est reduit.
                    </Text>
                </View>

                <Footer pageNum={3} />
            </Page>
        </Document>
    );
};

export default PDFReportAG;
