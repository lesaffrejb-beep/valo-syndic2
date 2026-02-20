"use client";

/**
 * VALO-SYNDIC — DiagnosticResults
 * ================================
 * Financial ledger view: Macro KPIs + Ticket de Caisse restructuré en 2 temps financiers.
 *
 * Bloc A : Coût du Projet (Résolution AG) — ce que le syndicat vote.
 * Bloc B : Plan de Financement & Trésorerie — ce que le syndicat doit trouver.
 *
 * Conformité Loi 65 / Paramètres réglementaires 2026.
 */

import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import { formatCurrency } from "@/lib/calculator";
import { FileText, AlertTriangle } from "lucide-react";
import PersonalSimulator from "@/components/diagnostic/PersonalSimulator";
import PDFDownloadButton from "@/components/pdf/PDFDownloadButton";
import DiagnosticPDF from "@/components/pdf/DiagnosticPDF";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ label, color }: { label: string; color: "danger" | "warning" | "success" }) {
    const styles: Record<string, string> = {
        danger: "bg-cost-light text-cost border-cost/20",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        success: "bg-gain-light text-gain border-gain/20",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] rounded border ${styles[color]}`}
        >
            {label}
        </span>
    );
}

/** Badge d'alerte réglementaire — affiché sur les aides à statut incertain */
function AlertBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded border bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
            <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
            {label}
        </span>
    );
}

function SectionHeader({ accent, title }: { accent: string; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
            <div className={`w-1 h-4 rounded-full ${accent}`} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate">{title}</span>
        </div>
    );
}

function LedgerRow({
    label,
    amount,
    variant = "default",
    tag,
    alertBadge,
    subNote,
}: {
    label: string;
    amount: number;
    variant?: "default" | "subtotal-cost" | "subtotal-aid" | "final" | "call";
    tag?: string;
    /** Badge d'alerte réglementaire (ex : suspension LFI 2026) */
    alertBadge?: string;
    /** Sous-ligne informative en gris (ex : frais garantie SACICAP) */
    subNote?: string;
}) {
    const rowStyles: Record<string, string> = {
        default: "py-2.5",
        "subtotal-cost": "py-3 bg-slate-50/80 font-semibold border-t border-border",
        "subtotal-aid": "py-3 bg-gain-light/40 font-semibold border-t border-border",
        call: "py-3 bg-navy/5 font-semibold border-t border-border",
        final: "py-4 bg-brass-muted border-t-2 border-brass/30 font-bold",
    };

    const labelStyles: Record<string, string> = {
        default: "text-sm text-slate",
        "subtotal-cost": "text-sm text-oxford",
        "subtotal-aid": "text-sm text-gain",
        call: "text-sm text-navy",
        final: "text-base font-serif text-oxford",
    };

    const amountStyles: Record<string, string> = {
        default: "text-sm text-oxford tabular-nums",
        "subtotal-cost": "text-sm text-oxford tabular-nums font-semibold",
        "subtotal-aid": "text-sm text-gain tabular-nums font-semibold",
        call: "text-sm text-navy tabular-nums font-semibold",
        final: "text-lg font-serif text-oxford tabular-nums font-bold",
    };

    const isAid = variant === "subtotal-aid";

    return (
        <div>
            <div className={`flex items-center justify-between px-4 rounded-md ${rowStyles[variant]}`}>
                <div className="flex items-center flex-wrap gap-2 min-w-0">
                    <span className={`${labelStyles[variant]} leading-snug`}>{label}</span>
                    {tag && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-navy/5 text-navy border border-navy/10">
                            {tag}
                        </span>
                    )}
                    {alertBadge && <AlertBadge label={alertBadge} />}
                </div>
                <span className={`${amountStyles[variant]} ml-3 flex-shrink-0`}>
                    {isAid ? `− ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
                </span>
            </div>
            {subNote && (
                <p className="text-[9px] text-subtle px-4 pb-1 -mt-1 leading-relaxed italic">{subNote}</p>
            )}
        </div>
    );
}

function KpiCard({
    label,
    value,
    unit,
    accent = "default",
}: {
    label: string;
    value: string;
    unit: string;
    accent?: "default" | "positive" | "negative";
}) {
    const accentStyles: Record<string, string> = {
        default: "text-oxford",
        positive: "text-gain",
        negative: "text-slate",
    };
    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-card border border-border bg-white text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-2">
                {label}
            </span>
            <span className={`text-2xl md:text-3xl font-serif font-bold tabular-nums ${accentStyles[accent]}`}>
                {value}
            </span>
            <span className="text-[10px] text-subtle mt-1">{unit}</span>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DiagnosticResults() {
    const { result } = useDiagnosticStore();

    // ── Empty State ──────────────────────────────────────────
    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-border flex items-center justify-center mb-6">
                    <FileText className="w-7 h-7 text-subtle" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl text-slate mb-2">
                    En attente des paramètres de la copropriété
                </h3>
                <p className="text-sm text-subtle max-w-sm">
                    Renseignez les données dans le formulaire ci-contre, puis cliquez sur
                    &ldquo;Générer l&rsquo;Analyse Financière&rdquo;.
                </p>
            </div>
        );
    }

    // ── Computed values ──────────────────────────────────────
    const { input, compliance, financing } = result;
    const perUnit = financing.perUnit;
    const numberOfUnits = input.numberOfUnits;

    const monthlySavingsPerLot = numberOfUnits > 0
        ? Math.round(financing.monthlyEnergySavings / numberOfUnits)
        : 0;

    const cashflowPerLot = perUnit?.cashflowNetParLot ?? 0;
    const mprRateLabel = `${Math.round(financing.mprRate * 100)}%`;

    // Total aids sum
    const totalAids =
        financing.mprAmount +
        financing.amoAmount +
        financing.ceeAmount +
        financing.localAidAmount;

    // Reste au comptant (appel de fonds immédiat)
    const resteComptant = financing.cashDownPayment;

    // Effort de trésorerie réel lissé = mensualité Éco-PTZ − économies énergie / mois
    const effortMensuel = Math.max(0, financing.monthlyPayment - financing.monthlyEnergySavings);

    return (
        <div className="space-y-6 animate-fadeInUp">

            {/* ── Header ──────────────────────────────────────── */}
            <div className="card card-content">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-oxford">
                            {input.address || "Copropriété"}
                        </h2>
                        <p className="text-xs text-subtle mt-1">
                            {numberOfUnits} lots · DPE {input.currentDPE} → {input.targetDPE} · Gain énergétique {Math.round(financing.energyGainPercent * 100)}%
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <PDFDownloadButton
                            document={<DiagnosticPDF result={result} />}
                            fileName={`diagnostic-${input.address ? input.address.slice(0, 30).replace(/\s/g, "_") : "copro"}.pdf`}
                        />
                        <StatusBadge label={compliance.statusLabel} color={compliance.statusColor} />
                    </div>
                </div>
            </div>

            {/* ── Macro KPIs ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                    label="Mensualité Éco-PTZ"
                    value={perUnit ? `${perUnit.mensualiteParLot} €` : "—"}
                    unit="par lot / mois"
                />
                <KpiCard
                    label="Économie énergie théorique"
                    value={`${monthlySavingsPerLot} €`}
                    unit="par lot / mois (Base DPE post-travaux)"
                    accent="positive"
                />
                <KpiCard
                    label="Flux net mensuel"
                    value={`${cashflowPerLot > 0 ? "+" : ""}${cashflowPerLot} €`}
                    unit="par lot / mois"
                    accent={cashflowPerLot >= 0 ? "positive" : "negative"}
                />
            </div>

            {/* ── Financial Ledger ────────────────────────────── */}
            <div className="card card-content">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-navy rounded-full" />
                    <h3 className="font-serif text-lg font-semibold text-oxford">
                        Ticket de Caisse
                    </h3>
                </div>

                {/* ══ BLOC A : Coût du Projet (Résolution AG) ═════════════════════ */}
                <SectionHeader accent="bg-navy" title="Bloc A — Coût du Projet (Résolution AG)" />

                <div className="space-y-0.5 rounded-lg border border-border overflow-hidden mb-2">
                    <LedgerRow label="Travaux HT" amount={financing.worksCostHT} />
                    <LedgerRow
                        label="Honoraires Syndic (3%)"
                        amount={financing.syndicFees}
                        tag="Art. 11 ALUR"
                    />
                    <LedgerRow label="Assurance DO (2%)" amount={financing.doFees} />
                    <LedgerRow label="Provision Aléas (5%)" amount={financing.contingencyFees} />
                    <LedgerRow label="AMO Ingénierie" amount={financing.amoCostTTC} />
                    <LedgerRow label="TOTAL TTC" amount={financing.totalCostTTC} variant="subtotal-cost" />
                </div>

                {/* ══ BLOC B : Plan de Financement & Trésorerie ═══════════════════ */}
                <SectionHeader accent="bg-brass" title="Bloc B — Plan de Financement &amp; Trésorerie" />

                <div className="space-y-0.5 rounded-lg border border-border overflow-hidden mb-2">

                    {/* Appel de fonds initial */}
                    <LedgerRow
                        label="Appel de Fonds Initial (Préfinancement Loi 65)"
                        amount={financing.totalCostTTC}
                        variant="call"
                    />

                    <div className="h-1" />

                    {/* Aides */}
                    <LedgerRow
                        label="MaPrimeRénov' Copropriété"
                        amount={financing.mprAmount}
                        variant="subtotal-aid"
                        tag={mprRateLabel}
                        alertBadge="Aide conditionnelle — En attente LFI 2026"
                    />
                    <LedgerRow
                        label="CEE (Certificats d'Économie d'Énergie)"
                        amount={financing.ceeAmount}
                        variant="subtotal-aid"
                    />
                    <LedgerRow
                        label="Subvention AMO (50%)"
                        amount={financing.amoAmount}
                        variant="subtotal-aid"
                    />
                    {(financing.localAidAmount > 0 || true) && (
                        <LedgerRow
                            label="Mieux chez moi (Angers Loire Métropole)"
                            amount={financing.localAidAmount}
                            variant="subtotal-aid"
                        />
                    )}
                    {(input.alurFund ?? 0) > 0 && (
                        <LedgerRow
                            label="Fonds Travaux ALUR"
                            amount={input.alurFund ?? 0}
                            variant="subtotal-aid"
                        />
                    )}
                    <LedgerRow label="TOTAL AIDES" amount={totalAids} variant="subtotal-aid" />

                    <div className="h-1" />

                    {/* Éco-PTZ */}
                    <LedgerRow
                        label="Éco-PTZ Copropriété (Vote Art. 25)"
                        amount={financing.ecoPtzAmount}
                        variant="subtotal-aid"
                        subNote="Inclut provision 2,5% pour frais de garantie SACICAP et assurance emprunteur. Plafonné à 50 000 € / lot — Rénovation globale."
                    />

                    <div className="h-2" />

                    {/* Reste au comptant — appel immédiat */}
                    <LedgerRow
                        label="Reste au comptant (Appel de Fonds Immédiat)"
                        amount={resteComptant}
                        variant="subtotal-cost"
                    />

                    {/* Ligne finale Brass : Effort de Trésorerie Réel Lissé */}
                    <LedgerRow
                        label="Effort de Trésorerie Réel Lissé"
                        amount={effortMensuel}
                        variant="final"
                        subNote="Mensualité Éco-PTZ − Économie d'énergie théorique (Base DPE post-travaux) / mois"
                    />
                </div>

                <p className="text-[10px] text-subtle mt-4 leading-relaxed">
                    L&rsquo;Appel de Fonds Initial correspond au montant brut à mobiliser avant rentrée des aides.
                    Les subventions sont versées a posteriori — le syndicat assume la trésorerie intermédiaire.
                    L&rsquo;Éco-PTZ est remboursé en 240 mensualités à taux zéro (vote Art. 25 requis).
                </p>

                {/* Avertissement MaPrimeRénov' */}
                <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-4 py-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                        <strong>MaPrimeRénov&rsquo; Copropriété :</strong> Techniquement suspendue au 1er janvier 2026
                        faute de loi de finances promulguée. Le montant affiché est une estimation conditionnelle.
                        Validation obligatoire via l&rsquo;espace conseil <strong>Mieux chez moi</strong> (Angers Loire Métropole)
                        avant tout engagement.
                    </p>
                </div>
            </div>

            {/* ── Per-Unit Summary ─────────────────────────────── */}
            {perUnit && (
                <div className="card card-content">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1 h-5 bg-brass rounded-full" />
                        <h3 className="font-serif text-lg font-semibold text-oxford">
                            Synthèse par lot
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <Row label="Coût TTC / lot" value={formatCurrency(perUnit.coutParLotTTC)} />
                        <Row label="MPR / lot" value={`− ${formatCurrency(perUnit.mprParLot)}`} green />
                        <Row label="CEE / lot" value={`− ${formatCurrency(perUnit.ceeParLot)}`} green />
                        <Row label="Éco-PTZ / lot" value={formatCurrency(perUnit.ecoPtzParLot)} />
                        <Row label="RAC comptant / lot" value={formatCurrency(perUnit.racComptantParLot)} bold />
                        <Row label="Avantage fiscal An 1" value={`− ${formatCurrency(perUnit.avantagesFiscauxAnnee1)}`} green />
                        <Row label="Potentiel Valeur Verte / lot" value={`+ ${formatCurrency(perUnit.valeurVerteParLot)}`} green />
                    </div>
                </div>
            )}

            {/* ── Personal Simulator ─────────────────────────────── */}
            <div className="card card-content">
                <PersonalSimulator result={result} />
            </div>
        </div>
    );
}

// ── Tiny helper for the per-unit grid ────────────────────────────────────────
function Row({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-xs text-slate">{label}</span>
            <span
                className={`text-sm tabular-nums ${bold ? "font-semibold text-oxford" : ""} ${green ? "text-gain" : "text-oxford"}`}
            >
                {value}
            </span>
        </div>
    );
}
