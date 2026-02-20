/**
 * VALO-SYNDIC — DiagnosticPDF
 * ============================
 * 3-page A4 PDF report for General Assembly convocation.
 * Built with @react-pdf/renderer using built-in fonts (Times-Roman, Helvetica).
 */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import type { DiagnosticResult } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculator";
import { FINANCES_2026 } from "@/lib/financialConstants";

// ─── Color Tokens ────────────────────────────────────────────────────────────
const C = {
    oxford: "#111827",
    slate: "#475569",
    subtle: "#94A3B8",
    brass: "#B8963E",
    navy: "#1E3A8A",
    gain: "#166534",
    cost: "#991B1B",
    border: "#E2E8F0",
    bg: "#F9F8F6",
    white: "#FFFFFF",
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        paddingTop: 50,
        paddingBottom: 60,
        paddingHorizontal: 50,
        fontFamily: "Helvetica",
        fontSize: 9,
        color: C.oxford,
        backgroundColor: C.white,
    },

    // ── Header ──────────────────────
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.brass,
    },
    headerLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
        letterSpacing: 2,
        color: C.brass,
        textTransform: "uppercase",
    },
    headerDate: {
        fontSize: 7,
        color: C.subtle,
    },

    // ── Titles ──────────────────────
    pageTitle: {
        fontFamily: "Times-Roman",
        fontSize: 22,
        color: C.oxford,
        marginBottom: 6,
    },
    pageSubtitle: {
        fontSize: 9,
        color: C.slate,
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: "Times-Bold",
        fontSize: 13,
        color: C.oxford,
        marginBottom: 10,
        marginTop: 20,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },

    // ── Hero Metric ─────────────────
    heroBox: {
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 6,
        padding: 24,
        alignItems: "center",
        marginTop: 16,
        marginBottom: 24,
    },
    heroLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 7,
        letterSpacing: 1.5,
        color: C.slate,
        textTransform: "uppercase",
        marginBottom: 6,
    },
    heroValue: {
        fontFamily: "Times-Bold",
        fontSize: 42,
        color: C.oxford,
    },
    heroUnit: {
        fontFamily: "Times-Roman",
        fontSize: 14,
        color: C.slate,
        marginTop: 2,
    },
    heroCaption: {
        fontSize: 8,
        color: C.subtle,
        marginTop: 8,
        textAlign: "center",
    },

    // ── Info Grid ────────────────────
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 16,
    },
    infoCell: {
        width: "50%",
        paddingVertical: 5,
        paddingRight: 10,
    },
    infoLabel: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        letterSpacing: 0.8,
        color: C.subtle,
        textTransform: "uppercase",
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 10,
        color: C.oxford,
    },

    // ── Ledger Table ────────────────
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    rowLabel: {
        fontSize: 9,
        color: C.slate,
        flex: 1,
    },
    rowAmount: {
        fontSize: 9,
        color: C.oxford,
        textAlign: "right",
        width: 90,
    },
    subtotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: 8,
        backgroundColor: C.bg,
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    subtotalLabel: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
        color: C.oxford,
        flex: 1,
    },
    subtotalAmount: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
        color: C.oxford,
        textAlign: "right",
        width: 90,
    },
    aidRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
    },
    aidLabel: {
        fontSize: 9,
        color: C.gain,
        flex: 1,
    },
    aidAmount: {
        fontSize: 9,
        color: C.gain,
        textAlign: "right",
        width: 90,
    },
    finalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginTop: 4,
        borderTopWidth: 2,
        borderTopColor: C.brass,
        borderBottomWidth: 2,
        borderBottomColor: C.brass,
    },
    finalLabel: {
        fontFamily: "Times-Bold",
        fontSize: 12,
        color: C.oxford,
        flex: 1,
    },
    finalAmount: {
        fontFamily: "Times-Bold",
        fontSize: 12,
        color: C.oxford,
        textAlign: "right",
        width: 100,
    },
    tag: {
        fontSize: 6,
        fontFamily: "Helvetica-Bold",
        color: C.navy,
        backgroundColor: "#DBEAFE",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
        marginLeft: 6,
    },

    // ── Footer ──────────────────────
    footer: {
        position: "absolute",
        bottom: 25,
        left: 50,
        right: 50,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 0.5,
        borderTopColor: C.border,
        paddingTop: 8,
    },
    footerText: {
        fontSize: 6,
        color: C.subtle,
    },

    // ── Per-Unit Cards ──────────────
    cardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    card: {
        width: "48%",
        marginRight: "2%",
        marginBottom: 8,
        padding: 12,
        borderWidth: 0.5,
        borderColor: C.border,
        borderRadius: 4,
        backgroundColor: C.bg,
    },
    cardLabel: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        letterSpacing: 0.5,
        color: C.subtle,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    cardValue: {
        fontFamily: "Times-Bold",
        fontSize: 16,
        color: C.oxford,
    },
    cardCaption: {
        fontSize: 7,
        color: C.subtle,
        marginTop: 2,
    },

    // ── Callout Box ─────────────────
    callout: {
        marginTop: 16,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: C.brass,
        backgroundColor: "#FEFBF3",
        borderRadius: 3,
    },
    calloutTitle: {
        fontFamily: "Helvetica-Bold",
        fontSize: 9,
        color: C.oxford,
        marginBottom: 4,
    },
    calloutText: {
        fontSize: 8,
        color: C.slate,
        lineHeight: 1.5,
    },
});

// ─── Document ────────────────────────────────────────────────────────────────

export default function DiagnosticPDF({ result }: { result: DiagnosticResult }) {
    const { input, financing, valuation } = result;
    const n = input.numberOfUnits;
    const perUnit = financing.perUnit;
    const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const monthlyPerLot = Math.round(financing.monthlyPayment / n);
    const savingsPerLot = Math.round(financing.monthlyEnergySavings / n);
    const effortReel = monthlyPerLot - savingsPerLot;

    const totalAids = financing.mprAmount + financing.ceeAmount + financing.localAidAmount + financing.amoAmount;
    const resteComptant = financing.cashDownPayment;
    const mprRateLabel = `${Math.round(financing.mprRate * 100)}%`;

    return (
        <Document title={`Diagnostic Patrimonial — ${input.address || "Copropriété"}`} author="Valo-Syndic">

            {/* ────────────────────────────────────────────────────
                PAGE 1 — Executive Summary
               ──────────────────────────────────────────────────── */}
            <Page size="A4" style={s.page}>
                <View style={s.header}>
                    <Text style={s.headerLabel}>Diagnostic Patrimonial &amp; Financier</Text>
                    <Text style={s.headerDate}>{now}</Text>
                </View>

                <Text style={s.pageTitle}>{input.address || "Copropriété"}</Text>
                <Text style={s.pageSubtitle}>
                    Simulation de valorisation — Barèmes ANAH 2026
                </Text>

                {/* Synthèse du Projet */}
                <Text style={s.sectionTitle}>Synthèse du Projet</Text>
                <View style={s.infoGrid}>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Nombre de lots</Text>
                        <Text style={s.infoValue}>{n}</Text>
                    </View>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>DPE Initial → Cible</Text>
                        <Text style={s.infoValue}>{input.currentDPE} → {input.targetDPE}</Text>
                    </View>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Gain Énergétique</Text>
                        <Text style={s.infoValue}>{Math.round(financing.energyGainPercent * 100)}%</Text>
                    </View>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Chauffage</Text>
                        <Text style={s.infoValue}>{input.heatingSystem || "Non renseigné"}</Text>
                    </View>
                </View>

                {/* Hero: Effort Réel */}
                <View style={s.heroBox}>
                    <Text style={s.heroLabel}>Effort Réel par Lot et par Mois</Text>
                    <Text style={s.heroValue}>
                        {effortReel > 0 ? `${effortReel} €` : `+ ${Math.abs(effortReel)} €`}
                    </Text>
                    <Text style={s.heroUnit}>/ mois</Text>
                    <Text style={s.heroCaption}>
                        Mensualité Éco-PTZ ({monthlyPerLot} €) − Économie énergie ({savingsPerLot} €)
                    </Text>
                </View>

                {/* Macro Cards */}
                <View style={s.cardGrid}>
                    <View style={s.card}>
                        <Text style={s.cardLabel}>Total Travaux TTC</Text>
                        <Text style={s.cardValue}>{formatCurrency(financing.totalCostTTC)}</Text>
                    </View>
                    <View style={s.card}>
                        <Text style={s.cardLabel}>Total Aides Obtenues</Text>
                        <Text style={[s.cardValue, { color: C.gain }]}>{formatCurrency(totalAids)}</Text>
                    </View>
                    <View style={s.card}>
                        <Text style={s.cardLabel}>Reste au Comptant</Text>
                        <Text style={s.cardValue}>{formatCurrency(resteComptant)}</Text>
                    </View>
                    <View style={s.card}>
                        <Text style={s.cardLabel}>Valeur Verte</Text>
                        <Text style={[s.cardValue, { color: C.gain }]}>+ {formatCurrency(valuation.greenValueGain)}</Text>
                    </View>
                </View>

                <PageFooter />
            </Page>

            {/* ────────────────────────────────────────────────────
                PAGE 2 — Financial Ledger
               ──────────────────────────────────────────────────── */}
            <Page size="A4" style={s.page}>
                <View style={s.header}>
                    <Text style={s.headerLabel}>Plan de Financement Détaillé</Text>
                    <Text style={s.headerDate}>{now}</Text>
                </View>

                <Text style={s.pageTitle}>Ticket de Caisse</Text>
                <Text style={s.pageSubtitle}>Décomposition complète du plan de financement collectif</Text>

                {/* Group 1: Costs */}
                <Text style={s.sectionTitle}>Coûts</Text>
                <LedgerRow label="Travaux HT" amount={formatCurrency(financing.worksCostHT)} />
                <LedgerRow label="Honoraires Syndic (3%)" amount={formatCurrency(financing.syndicFees)} />
                <LedgerRow label="Assurance Dommages-Ouvrage (2%)" amount={formatCurrency(financing.doFees)} />
                <LedgerRow label="Provision Aléas (5%)" amount={formatCurrency(financing.contingencyFees)} />
                <LedgerRow label="AMO Ingénierie" amount={formatCurrency(financing.amoCostTTC)} />
                <SubtotalRow label="TOTAL TTC" amount={formatCurrency(financing.totalCostTTC)} />

                {/* Group 2: Subsidies */}
                <Text style={s.sectionTitle}>Aides &amp; Subventions</Text>
                <AidRow label={`MaPrimeRénov' Copro (${mprRateLabel})`} amount={formatCurrency(financing.mprAmount)} />
                <AidRow label="CEE (Certificats d'Économie d'Énergie)" amount={formatCurrency(financing.ceeAmount)} />
                <AidRow label="Subvention AMO (50%)" amount={formatCurrency(financing.amoAmount)} />
                {financing.localAidAmount > 0 && (
                    <AidRow label="Aides locales" amount={formatCurrency(financing.localAidAmount)} />
                )}
                {(input.alurFund ?? 0) > 0 && (
                    <AidRow label="Fonds Travaux ALUR" amount={formatCurrency(input.alurFund ?? 0)} />
                )}
                <SubtotalRow label="TOTAL AIDES" amount={formatCurrency(totalAids)} isAid />

                {/* Group 3: Financing */}
                <Text style={s.sectionTitle}>Financement</Text>
                <LedgerRow label="Reste à charge brut" amount={formatCurrency(financing.remainingCost)} />
                <AidRow label="Éco-PTZ accordé (20 ans, 0%)" amount={formatCurrency(financing.ecoPtzAmount)} />

                {/* Final */}
                <View style={s.finalRow}>
                    <Text style={s.finalLabel}>RESTE AU COMPTANT</Text>
                    <Text style={s.finalAmount}>{formatCurrency(resteComptant)}</Text>
                </View>
                <Text style={{ fontSize: 7, color: C.subtle, marginTop: 6 }}>
                    Montant à régler immédiatement par le syndicat des copropriétaires.
                    Le capital Éco-PTZ est remboursé en 240 mensualités à taux zéro.
                </Text>

                <PageFooter />
            </Page>

            {/* ────────────────────────────────────────────────────
                PAGE 3 — Individual Impact & Fiscalité
               ──────────────────────────────────────────────────── */}
            <Page size="A4" style={s.page}>
                <View style={s.header}>
                    <Text style={s.headerLabel}>Impact Individuel &amp; Fiscalité</Text>
                    <Text style={s.headerDate}>{now}</Text>
                </View>

                <Text style={s.pageTitle}>Impact par Lot</Text>
                <Text style={s.pageSubtitle}>
                    Calculs individuels basés sur {n} lots — Quote-part uniforme (1/{n}ᵉ)
                </Text>

                {perUnit && (
                    <View style={s.cardGrid}>
                        <View style={s.card}>
                            <Text style={s.cardLabel}>Coût TTC / lot</Text>
                            <Text style={s.cardValue}>{formatCurrency(perUnit.coutParLotTTC)}</Text>
                        </View>
                        <View style={s.card}>
                            <Text style={s.cardLabel}>MPR / lot</Text>
                            <Text style={[s.cardValue, { color: C.gain }]}>− {formatCurrency(perUnit.mprParLot)}</Text>
                        </View>
                        <View style={s.card}>
                            <Text style={s.cardLabel}>Éco-PTZ / lot</Text>
                            <Text style={s.cardValue}>{formatCurrency(perUnit.ecoPtzParLot)}</Text>
                        </View>
                        <View style={s.card}>
                            <Text style={s.cardLabel}>RAC Comptant / lot</Text>
                            <Text style={[s.cardValue, { fontFamily: "Times-Bold" }]}>{formatCurrency(perUnit.racComptantParLot)}</Text>
                        </View>
                        <View style={s.card}>
                            <Text style={s.cardLabel}>Mensualité / lot</Text>
                            <Text style={s.cardValue}>{perUnit.mensualiteParLot} € / mois</Text>
                        </View>
                        <View style={s.card}>
                            <Text style={s.cardLabel}>Valeur Verte / lot</Text>
                            <Text style={[s.cardValue, { color: C.gain }]}>+ {formatCurrency(perUnit.valeurVerteParLot)}</Text>
                        </View>
                    </View>
                )}

                {/* Déficit Foncier Callout */}
                <View style={s.callout}>
                    <Text style={s.calloutTitle}>
                        Propriétaires Bailleurs — Avantage Fiscal (Déficit Foncier)
                    </Text>
                    <Text style={s.calloutText}>
                        Les propriétaires bailleurs peuvent imputer le reste à charge comptant sur leurs revenus
                        fonciers au titre du Déficit Foncier. Avec un taux marginal d&apos;imposition de 30% et les
                        prélèvements sociaux de 17.2%, le taux de déduction effectif est de{" "}
                        {Math.round(FINANCES_2026.DEFICIT_FONCIER.TAUX_EFFECTIF * 100)}%.
                    </Text>
                    {perUnit && (
                        <Text style={[s.calloutText, { marginTop: 6, fontFamily: "Helvetica-Bold" }]}>
                            Économie d&apos;impôt estimée Année 1 : − {formatCurrency(perUnit.avantagesFiscauxAnnee1)} par lot
                        </Text>
                    )}
                    <Text style={[s.calloutText, { marginTop: 4 }]}>
                        Ce montant est reportable sur 10 ans en cas de revenus fonciers insuffisants.
                        Simulation indicative — consultez votre conseiller fiscal.
                    </Text>
                </View>

                {/* ROI Summary */}
                <Text style={s.sectionTitle}>Bilan Patrimonial</Text>
                <View style={s.infoGrid}>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Valeur actuelle estimée</Text>
                        <Text style={s.infoValue}>{formatCurrency(valuation.currentValue)}</Text>
                    </View>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Valeur après travaux</Text>
                        <Text style={s.infoValue}>{formatCurrency(valuation.projectedValue)}</Text>
                    </View>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>Plus-value Valeur Verte</Text>
                        <Text style={[s.infoValue, { color: C.gain }]}>+ {formatCurrency(valuation.greenValueGain)}</Text>
                    </View>
                    <View style={s.infoCell}>
                        <Text style={s.infoLabel}>ROI Net</Text>
                        <Text style={[s.infoValue, { color: valuation.netROI >= 0 ? C.gain : C.cost }]}>
                            {formatCurrency(valuation.netROI)}
                        </Text>
                    </View>
                </View>

                <PageFooter />
            </Page>

            {/* ────────────────────────────────────────────────────
                PAGE 4 — Annexe Juridique
               ──────────────────────────────────────────────────── */}
            <Page size="A4" style={s.page}>
                <View style={s.header}>
                    <Text style={s.headerLabel}>Annexe : Mentions Légales &amp; RGPD</Text>
                    <Text style={s.headerDate}>{now}</Text>
                </View>

                <Text style={s.pageTitle}>Cadre Juridique et Protection des Données</Text>
                <Text style={s.pageSubtitle}>
                    Conditions d&apos;utilisation et politique de confidentialité appliquées au 1er février 2026.
                </Text>

                <Text style={s.sectionTitle}>1. Clause d&apos;exclusion de responsabilité (Disclaimer)</Text>

                <Text style={[s.calloutTitle, { marginTop: 8 }]}>1.1. Nature de l&apos;outil</Text>
                <Text style={s.calloutText}>
                    Le simulateur ValoSyndic est un outil d&apos;aide à la décision à caractère prospectif. Les résultats (économies d&apos;énergie, reste à charge, effort de trésorerie) sont des estimations fondées sur les données saisies par l&apos;utilisateur et les barèmes légaux en vigueur au 1er février 2026. Ils ne constituent en aucun cas un engagement contractuel ou une garantie de performance financière.
                </Text>

                <Text style={[s.calloutTitle, { marginTop: 12 }]}>1.2. Incertitude législative et fiscale</Text>
                <View style={{ marginLeft: 10, marginTop: 4 }}>
                    <Text style={s.calloutText}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Subventions :</Text> Le calcul de MaPrimeRénov&apos; Copropriété est effectué sous réserve de la validation définitive des crédits par la Loi de Finances 2026. Tout changement de réglementation entre la simulation et le dépôt du dossier est opposable au bénéficiaire.</Text>
                    <Text style={[s.calloutText, { marginTop: 4 }]}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Fiscalité :</Text> Les projections de déficit foncier (Art. 31 et 156 du CGI) sont indicatives. L&apos;éligibilité réelle des travaux et la validation de la déduction relèvent de la responsabilité exclusive du contribuable face à l&apos;administration fiscale.</Text>
                </View>

                <Text style={[s.calloutTitle, { marginTop: 12 }]}>1.3. Absence de Dol et Information des Copropriétaires</Text>
                <Text style={s.calloutText}>
                    Le présent document ne dispense pas le syndic de présenter en Assemblée Générale les devis définitifs des entreprises ainsi que le contrat de prêt collectif, conformément au Décret n° 67-223 du 17 mars 1967. L&apos;indicateur « Effort de Trésorerie » est une grandeur théorique et n&apos;exonère pas le copropriétaire du paiement intégral des appels de fonds travaux décidés selon les majorités de la Loi du 10 juillet 1965 (Art. 24, 25 ou 26).
                </Text>

                <Text style={[s.sectionTitle, { marginTop: 24 }]}>2. Protection des Données Personnelles (RGPD)</Text>
                <Text style={[s.calloutText, { marginBottom: 8 }]}>
                    Conformément au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés, le cabinet précise les conditions de traitement des données saisies :
                </Text>

                <View style={{ marginLeft: 10 }}>
                    <Text style={s.calloutText}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Finalité :</Text> Réalisation de la simulation financière de rénovation énergétique.</Text>
                    <Text style={[s.calloutText, { marginTop: 4 }]}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Base légale :</Text> Intérêt légitime du syndic dans l&apos;exécution de sa mission de conseil (Loi du 10 juillet 1965).</Text>
                    <Text style={[s.calloutText, { marginTop: 4 }]}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Conservation :</Text> En mode Rapport PDF, les données sont conservées uniquement le temps de la génération du document.</Text>
                    <Text style={[s.calloutText, { marginTop: 4 }]}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Non-cession :</Text> Aucune donnée financière personnelle n&apos;est cédée à des tiers sans consentement écrit.</Text>
                    <Text style={[s.calloutText, { marginTop: 4 }]}>• <Text style={{ fontFamily: "Helvetica-Bold" }}>Droits :</Text> Accès, rectification et suppression auprès du DPO (lesaffrejb@gmail.com).</Text>
                </View>

                <PageFooter />
            </Page>
        </Document>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PageFooter() {
    return (
        <View style={s.footer} fixed>
            <Text style={s.footerText}>
                Généré par Valo-Syndic — Simulation indicative, non contractuelle
            </Text>
            <Text
                style={s.footerText}
                render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            />
        </View>
    );
}

function LedgerRow({ label, amount }: { label: string; amount: string }) {
    return (
        <View style={s.row}>
            <Text style={s.rowLabel}>{label}</Text>
            <Text style={s.rowAmount}>{amount}</Text>
        </View>
    );
}

function AidRow({ label, amount }: { label: string; amount: string }) {
    return (
        <View style={s.aidRow}>
            <Text style={s.aidLabel}>{label}</Text>
            <Text style={s.aidAmount}>− {amount}</Text>
        </View>
    );
}

function SubtotalRow({ label, amount, isAid }: { label: string; amount: string; isAid?: boolean }) {
    return (
        <View style={s.subtotalRow}>
            <Text style={[s.subtotalLabel, isAid ? { color: C.gain } : {}]}>{label}</Text>
            <Text style={[s.subtotalAmount, isAid ? { color: C.gain } : {}]}>{isAid ? `− ${amount}` : amount}</Text>
        </View>
    );
}
