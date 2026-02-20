"use client";

/**
 * VALO-SYNDIC — DiagnosticResults
 * ================================
 * Financial ledger view: Macro KPIs + Ticket de Caisse (cost/aid/financing breakdown).
 * Reads `result` from useDiagnosticStore. Renders an elegant empty state when null.
 */

import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import { formatCurrency } from "@/lib/calculator";
import { FileText } from "lucide-react";
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

function LedgerRow({
    label,
    amount,
    variant = "default",
    tag,
}: {
    label: string;
    amount: number;
    variant?: "default" | "subtotal-cost" | "subtotal-aid" | "final";
    tag?: string;
}) {
    const rowStyles: Record<string, string> = {
        default: "py-2.5",
        "subtotal-cost": "py-3 bg-slate-50/80 font-semibold border-t border-border",
        "subtotal-aid": "py-3 bg-gain-light/40 font-semibold border-t border-border",
        final: "py-4 bg-brass-muted border-t-2 border-brass/30 font-bold",
    };

    const labelStyles: Record<string, string> = {
        default: "text-sm text-slate",
        "subtotal-cost": "text-sm text-oxford",
        "subtotal-aid": "text-sm text-gain",
        final: "text-base font-serif text-oxford",
    };

    const amountStyles: Record<string, string> = {
        default: "text-sm text-oxford tabular-nums",
        "subtotal-cost": "text-sm text-oxford tabular-nums font-semibold",
        "subtotal-aid": "text-sm text-gain tabular-nums font-semibold",
        final: "text-lg font-serif text-oxford tabular-nums font-bold",
    };

    return (
        <div className={`flex items-center justify-between px-4 rounded-md ${rowStyles[variant]}`}>
            <div className="flex items-center gap-2">
                <span className={labelStyles[variant]}>{label}</span>
                {tag && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-navy/5 text-navy border border-navy/10">
                        {tag}
                    </span>
                )}
            </div>
            <span className={amountStyles[variant]}>
                {variant === "subtotal-aid" ? `− ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
            </span>
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
    const totalAids = financing.mprAmount + financing.amoAmount + financing.ceeAmount + financing.localAidAmount + (input.alurFund ?? 0);

    // Reste au comptant = remaining cost - ecoPtz (what must be paid immediately)
    const resteComptant = perUnit?.racComptantParLot
        ? perUnit.racComptantParLot * numberOfUnits
        : Math.max(0, financing.remainingCost - financing.ecoPtzAmount);

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
                    label="Économie énergie"
                    value={`${monthlySavingsPerLot} €`}
                    unit="par lot / mois"
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

                <div className="space-y-0.5">

                    {/* ── Group 1: Costs ──────────────────────── */}
                    <LedgerRow label="Travaux HT" amount={financing.worksCostHT} />
                    <LedgerRow label="Honoraires Syndic (3%)" amount={financing.syndicFees} />
                    <LedgerRow label="Assurance DO (2%)" amount={financing.doFees} />
                    <LedgerRow label="Provision Aléas (3%)" amount={financing.contingencyFees} />
                    <LedgerRow label="AMO Ingénierie" amount={financing.amoAmount} />
                    <LedgerRow label="TOTAL TTC" amount={financing.totalCostTTC} variant="subtotal-cost" />

                    <div className="h-3" />

                    {/* ── Group 2: Subsidies ──────────────────── */}
                    <LedgerRow label="MaPrimeRénov' Copro" amount={financing.mprAmount} variant="subtotal-aid" tag={mprRateLabel} />
                    <LedgerRow label="CEE" amount={financing.ceeAmount} variant="subtotal-aid" />
                    {financing.localAidAmount > 0 && (
                        <LedgerRow label="Aides locales" amount={financing.localAidAmount} variant="subtotal-aid" />
                    )}
                    {(input.alurFund ?? 0) > 0 && (
                        <LedgerRow label="Fonds Travaux ALUR" amount={input.alurFund ?? 0} variant="subtotal-aid" />
                    )}
                    <LedgerRow label="TOTAL AIDES" amount={totalAids} variant="subtotal-aid" />

                    <div className="h-3" />

                    {/* ── Group 3: Financing ──────────────────── */}
                    <LedgerRow label="Reste à charge brut" amount={financing.remainingCost} />
                    <LedgerRow label="Éco-PTZ accordé (20 ans, 0%)" amount={financing.ecoPtzAmount} variant="subtotal-aid" />

                    <div className="h-2" />

                    {/* ── Final: Reste au comptant ────────────── */}
                    <LedgerRow
                        label="RESTE AU COMPTANT"
                        amount={resteComptant}
                        variant="final"
                    />
                </div>

                <p className="text-[10px] text-subtle mt-4 leading-relaxed">
                    Montant à régler immédiatement par le syndicat des copropriétaires.
                    Le capital Éco-PTZ est remboursé en 240 mensualités à taux zéro.
                </p>
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
                        <Row label="Valeur Verte / lot" value={`+ ${formatCurrency(perUnit.valeurVerteParLot)}`} green />
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
