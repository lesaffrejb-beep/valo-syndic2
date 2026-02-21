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
import { FileText, AlertTriangle, ShieldCheck, Sparkles, Scale, ChevronDown } from "lucide-react";
import PersonalSimulator from "@/components/diagnostic/PersonalSimulator";
import PDFDownloadButton from "@/components/pdf/PDFDownloadButton";
import DiagnosticPDF from "@/components/pdf/DiagnosticPDF";
import { useState } from "react";
import LegalNoticeModal from "@/components/ui/LegalNoticeModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ label, color }: { label: string; color: "danger" | "warning" | "success" }) {
    const styles: Record<string, string> = {
        danger: "bg-red-50 text-red-700 border border-red-200",
        warning: "bg-orange-50/80 text-orange-800",
        success: "bg-[#009246]/10 text-[#009246] border border-[#009246]/20",
    };
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] rounded ${styles[color]}`}
        >
            {label}
        </span>
    );
}

/** Badge d'alerte réglementaire — affiché sur les aides à statut incertain */
function AlertBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-sm border bg-amber-50 text-amber-800 border-amber-200 whitespace-nowrap">
            <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
            {label}
        </span>
    );
}

function SectionHeader({ title, accent = "primary" }: { title: string; accent?: "primary" | "secondary" }) {
    const isPrimary = accent === "primary";
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className={`w-0.5 h-5 rounded-full flex-shrink-0 ${isPrimary ? "bg-navy" : "bg-navy/40"}`} />
            <h2 className={`text-base font-serif font-semibold tracking-tight ${isPrimary ? "text-oxford" : "text-slate"}`}>{title}</h2>
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
    variant?: "default" | "subtotal-cost" | "subtotal-aid" | "loan" | "final" | "call";
    tag?: string;
    /** Badge d'alerte réglementaire (ex : suspension LFI 2026) */
    alertBadge?: string;
    /** Sous-ligne informative en gris (ex : frais garantie SACICAP) */
    subNote?: string | React.ReactNode;
}) {
    const rowStyles: Record<string, string> = {
        default: "py-3 hover:bg-slate-50/80 transition-colors duration-150",
        "subtotal-cost": "pt-4 pb-3 bg-slate-50/80 font-bold border-t-2 border-slate-400",
        "subtotal-aid": "pt-4 pb-3 font-bold border-t-2 border-gain/40",
        loan: "pt-4 pb-3 font-semibold border-t border-border",
        call: "pt-4 pb-3 bg-slate-50/80 font-semibold border-t border-border",
        final: "py-4 bg-slate-50/80 border-t-2 border-navy font-bold",
    };

    const labelStyles: Record<string, string> = {
        default: "text-sm text-slate",
        "subtotal-cost": "text-sm text-oxford font-bold",
        "subtotal-aid": "text-sm text-gain font-bold",
        loan: "text-sm text-oxford",
        call: "text-sm text-oxford",
        final: "text-base font-serif text-navy",
    };

    const amountStyles: Record<string, string> = {
        default: "text-sm text-oxford tabular-nums",
        "subtotal-cost": "text-sm text-oxford tabular-nums font-bold",
        "subtotal-aid": "text-sm text-gain tabular-nums font-bold",
        loan: "text-sm text-info tabular-nums font-semibold",
        call: "text-sm text-oxford tabular-nums font-semibold",
        final: "text-xl font-serif text-navy tabular-nums font-bold",
    };

    const isDeduction = variant === "subtotal-aid" || variant === "loan";

    return (
        <div>
            <div className={`flex items-center px-4 rounded-md group ${rowStyles[variant]}`}>
                <div className="flex items-center flex-wrap gap-3 min-w-0">
                    <span className={`${labelStyles[variant]} leading-snug`}>{label}</span>
                    {tag && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-border">
                            {tag}
                        </span>
                    )}
                    {alertBadge && <AlertBadge label={alertBadge} />}
                </div>
                {variant === "default" ? (
                    <div className="flex-1 border-b border-dotted border-slate-300 mx-4 opacity-40 group-hover:opacity-60 relative -top-1 transition-opacity" />
                ) : (
                    <div className="flex-1" />
                )}
                <span className={`${amountStyles[variant]} ml-3 flex-shrink-0 text-right`}>
                    {isDeduction ? `− ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
                </span>
            </div>
            {subNote && (
                typeof subNote === 'string' ? (
                    <p className="text-[9px] text-subtle px-4 pb-1 -mt-1 leading-relaxed italic">{subNote}</p>
                ) : (
                    <div className="px-4 pb-1 -mt-1">{subNote}</div>
                )
            )}
        </div>
    );
}

// ─── Feature 4 — KPI Card with Semaphore indicator ───────────────────────────

function KpiCard({
    label,
    value,
    unit,
    accent = "default",
}: {
    label: string;
    value: string;
    unit: string;
    accent?: "default" | "positive" | "negative" | "warning";
}) {
    const borderStyles: Record<string, string> = {
        default: "border-l-navy/60",
        positive: "border-l-gain",
        negative: "border-l-cost",
        warning: "border-l-amber-500",
    };
    const valueStyles: Record<string, string> = {
        default: "text-oxford",
        positive: "text-gain",
        negative: "text-cost",
        warning: "text-amber-700",
    };
    const dotStyles: Record<string, string> = {
        default: "bg-navy/60",
        positive: "bg-gain",
        negative: "bg-cost",
        warning: "bg-amber-500",
    };
    return (
        <div className={`flex flex-col items-center justify-center p-5 rounded-card border border-border border-l-4 ${borderStyles[accent]} bg-white text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate mb-2 flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotStyles[accent]}`} />
                {label}
            </span>
            <span className={`text-2xl md:text-3xl font-serif font-bold tabular-nums ${valueStyles[accent]}`}>
                {value}
            </span>
            <span className="text-[10px] text-subtle mt-1.5">{unit}</span>
        </div>
    );
}

// ─── Feature 3 — Expert Summary Card ──────────────────────────────────────────

function ExpertSummary({
    address,
    currentDPE,
    targetDPE,
    totalCostTTC,
    cashDownPayment,
}: {
    address?: string | undefined;
    currentDPE: string;
    targetDPE: string;
    totalCostTTC: number;
    cashDownPayment: number;
}) {
    return (
        <div className="rounded-card border border-navy/20 bg-navy/5 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-navy flex-shrink-0" strokeWidth={1.8} />
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-navy">Résumé Décideur</span>
            </div>
            <div className="h-px sm:h-5 sm:w-px bg-border flex-shrink-0" />
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center gap-x-6 gap-y-2 flex-1">
                {/* Adresse */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-subtle">Copropriété</span>
                    <span className="text-[11px] font-semibold text-oxford leading-snug truncate max-w-[180px]">
                        {address || "—"}
                    </span>
                </div>
                {/* Gain DPE */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-subtle">Gain DPE</span>
                    <span className="text-[11px] font-serif font-bold text-oxford leading-snug">
                        <span className="text-cost">{currentDPE}</span>
                        <span className="text-subtle mx-1">→</span>
                        <span className="text-gain">{targetDPE}</span>
                    </span>
                </div>
                {/* Budget TTC */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-subtle">Budget TTC</span>
                    <span className="text-[11px] font-bold text-oxford tabular-nums leading-snug">
                        {formatCurrency(totalCostTTC)}
                    </span>
                </div>
                {/* RAC comptant */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-subtle">Reste au comptant</span>
                    <span className="text-[11px] font-bold text-cost tabular-nums leading-snug">
                        {formatCurrency(cashDownPayment)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Feature 2 — Legal Disclosure Accordion ────────────────────────────────────

function LegalDisclosureAccordion({ onOpenModal }: { onOpenModal: () => void }) {
    return (
        <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 group">
            <summary className="cursor-pointer flex items-center justify-between px-4 py-3 text-[10px] font-semibold text-slate-600 select-none list-none">
                <span>⚖️ Lire les mentions légales complètes &amp; RGPD</span>
                <ChevronDown
                    className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-open:rotate-180 flex-shrink-0"
                    strokeWidth={2}
                />
            </summary>
            <div className="px-4 pb-4 pt-4 space-y-3.5 border-t border-slate-200">
                {/* Avertissement MaPrimeRénov' */}
                <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-700">MaPrimeRénov&rsquo; Copropriété :</strong> Techniquement suspendue au 1er janvier 2026
                        faute de loi de finances promulguée. Le montant affiché est une estimation conditionnelle.
                        Validation obligatoire via l&rsquo;espace conseil <strong className="text-slate-700">Mieux chez moi</strong> (Angers Loire Métropole)
                        avant tout engagement.
                    </p>
                </div>
                {/* Avertissement légal principal */}
                <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
                    <Scale className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        <strong className="text-slate-600">Avertissement Légal :</strong> L&apos;« Effort de Trésorerie Mensuel » est une estimation nette intégrant des économies d&apos;énergie théoriques. Il ne reflète pas le montant réel de vos appels de fonds travaux ou de vos mensualités d&apos;emprunt, qui doivent être réglés intégralement à leurs échéances respectives. La responsabilité du syndic ne saurait être engagée en cas de variation des tarifs de l&apos;énergie ou des barèmes de subventions étatiques.
                    </p>
                </div>
                {/* Bouton modal mentions légales */}
                <div className="pt-1">
                    <button
                        onClick={onOpenModal}
                        className="text-[10px] font-semibold text-navy hover:text-navy-light hover:underline underline-offset-2 transition-all"
                    >
                        Ouvrir les mentions légales complètes &amp; RGPD →
                    </button>
                </div>
            </div>
        </details>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DiagnosticResults() {
    const { result } = useDiagnosticStore();

    // FIX AUDIT FEV 2026 : Toggle Plan Sécurisé / Plan Optimisé (MPR suspendue LFI 2026)
    // Défaut sur Plan Sécurisé pour éviter toute promesse commerciale trompeuse.
    const [securePlan, setSecurePlan] = useState(true);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

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
        (securePlan ? 0 : financing.mprAmount) +
        financing.amoAmount +
        financing.ceeAmount +
        financing.localAidAmount;

    // Reste au comptant (appel de fonds immédiat)
    const resteComptant = financing.cashDownPayment;

    // Effort de trésorerie réel lissé = mensualité Éco-PTZ − économies énergie / mois
    const effortMensuel = Math.max(0, financing.monthlyPayment - financing.monthlyEnergySavings);

    // ── KPI semaphore logic ──────────────────────────────────
    const savingsAccent: "positive" | "warning" =
        monthlySavingsPerLot > 0 ? "positive" : "warning";
    const cashflowAccent: "positive" | "negative" =
        cashflowPerLot >= 0 ? "positive" : "negative";

    return (
        <div className="space-y-6 animate-fadeInUp">

            {/* ── Feature 3 : Résumé Décideur ──────────────────── */}
            <ExpertSummary
                address={input.address}
                currentDPE={input.currentDPE}
                targetDPE={input.targetDPE}
                totalCostTTC={financing.totalCostTTC}
                cashDownPayment={financing.cashDownPayment}
            />


            {/* ── Feature 4 : Macro KPIs with Semaphores ──────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                    label="Mensualité Éco-PTZ"
                    value={perUnit ? `${perUnit.mensualiteParLot} €` : "—"}
                    unit="par lot / mois"
                    accent="default"
                />
                <KpiCard
                    label="Économie énergie théorique"
                    value={`${monthlySavingsPerLot} €`}
                    unit="par lot / mois (Base DPE post-travaux)"
                    accent={savingsAccent}
                />
                <KpiCard
                    label="Flux net mensuel"
                    value={`${cashflowPerLot > 0 ? "+" : ""}${cashflowPerLot} €`}
                    unit="par lot / mois"
                    accent={cashflowAccent}
                />
            </div>

            {/* ── Financial Ledger ────────────────────────────── */}
            <div className="card card-content">
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-0.5 h-5 bg-navy rounded-full" />
                    <h3 className="font-serif text-lg font-semibold text-oxford tracking-tight">
                        Ticket de Caisse
                    </h3>
                </div>

                {/* ── Coût du Projet (Résolution AG) ── */}

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

                {/* ── Plan de Financement & Trésorerie ── */}

                {/* FIX AUDIT FEV 2026 : Toggle Plan Sécurisé / Plan Optimisé */}
                <div className="flex flex-col sm:flex-row p-1 bg-slate-100 rounded-lg mb-6 border border-slate-200 gap-0.5">
                    <button
                        onClick={() => setSecurePlan(true)}
                        aria-pressed={securePlan}
                        className={`flex-1 px-4 py-2.5 rounded-md text-center transition-all duration-200 ${securePlan
                            ? "bg-navy text-white shadow-md ring-1 ring-navy font-semibold"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/70"
                            }`}
                    >
                        <div className="font-serif font-bold text-sm">Plan Sécurisé</div>
                        <div className={`text-[10px] mt-0.5 ${securePlan ? "text-white/90" : "text-slate-400"}`}>
                            Soutien modéré, sans MPR (+10% inclus)
                        </div>
                    </button>
                    <button
                        onClick={() => setSecurePlan(false)}
                        aria-pressed={!securePlan}
                        className={`flex-1 px-4 py-2.5 rounded-md text-center transition-all duration-200 ${!securePlan
                            ? "bg-navy text-white shadow-md ring-1 ring-navy font-semibold"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/70"
                            }`}
                    >
                        <div className="font-serif font-bold text-sm">Plan Optimisé</div>
                        <div className={`text-[10px] mt-0.5 ${!securePlan ? "text-white/90" : "text-slate-400"}`}>
                            Soutien maximal, MPR incluse (LFI)
                        </div>
                    </button>
                </div>

                <div className="space-y-0.5 rounded-lg border border-border overflow-hidden mb-2">

                    {/* Appel de fonds initial */}
                    <LedgerRow
                        label="Appel de Fonds Initial (Préfinancement Loi 65)"
                        amount={financing.totalCostTTC}
                        variant="call"
                    />

                    <div className="h-1" />

                    {/* Aides */}
                    {!securePlan && (
                        <LedgerRow
                            label="MaPrimeRénov\u2019 Copropriété"
                            amount={financing.mprAmount}
                            variant="subtotal-aid"
                            tag={mprRateLabel}
                            alertBadge="Sous réserve décrets LFI 2026"
                        />
                    )}
                    <LedgerRow
                        label="CEE (Certificats d'Économie d'Énergie)"
                        amount={financing.ceeAmount}
                        variant="subtotal-aid"
                        alertBadge="Indicatif — à contractualiser"
                        subNote="Estimation basée sur 8% des travaux HT (taux moyen de marché). Le montant CEE réel est fixé par contrat avec un opérateur selon les fiches standardisées ATEE/PNCEE."
                    />
                    <LedgerRow
                        label="Subvention AMO (50%)"
                        amount={financing.amoAmount}
                        variant="subtotal-aid"
                    />
                    {financing.localAidAmount > 0 && (
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
                        variant="loan"
                        subNote={
                            <div className="px-4 pb-2 mt-1 flex flex-col gap-1.5">
                                <div className="flex items-baseline justify-between border-t border-slate-200/60 pt-2.5">
                                    <span className="text-sm font-semibold text-navy italic">
                                        − {formatCurrency(financing.monthlyPayment)} / mois
                                    </span>
                                    <span className="text-[10px] text-slate-400 italic">sur 20 ans</span>
                                </div>
                                <p className="text-[9px] text-subtle leading-relaxed italic pr-4">
                                    Prêt à taux zéro — remboursé en 240 mensualités. Inclut provision 2,5% frais de garantie SACICAP. Plafonné à 50 000 € / lot — Rénovation globale.
                                </p>
                            </div>
                        }
                    />

                    <div className="h-2" />

                    {/* Reste au comptant — appel immédiat */}
                    <div className="pt-2 pb-2">
                        <LedgerRow
                            label="Reste au comptant (Appel de Fonds Immédiat)"
                            amount={resteComptant}
                            variant="subtotal-cost"
                        />
                    </div>

                    {/* Ligne finale : Effort de Trésorerie Réel Lissé */}
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

                {/* ── Feature 2 : Legal Disclosure Accordion ───── */}
                <LegalDisclosureAccordion onOpenModal={() => setIsLegalModalOpen(true)} />

                <LegalNoticeModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
            </div>

            {/* ── Per-Unit Summary ─────────────────────────────── */}
            {perUnit && (
                <div className="card card-content">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-0.5 h-5 bg-navy/40 rounded-full" />
                        <h3 className="font-serif text-base font-semibold text-oxford tracking-tight">
                            Synthèse par lot
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                        <Row label="Coût TTC / lot" value={formatCurrency(perUnit.coutParLotTTC)} />
                        {!securePlan && (
                            <Row label="MPR / lot" value={`− ${formatCurrency(perUnit.mprParLot)}`} green />
                        )}
                        <Row label="CEE / lot" value={`− ${formatCurrency(perUnit.ceeParLot)}`} green />
                        <Row label="Éco-PTZ / lot" value={formatCurrency(perUnit.ecoPtzParLot)} />
                        <Row label="RAC comptant / lot" value={formatCurrency(perUnit.racComptantParLot)} bold />
                        <Row label="Avantage fiscal An 1" value={`− ${formatCurrency(perUnit.avantagesFiscauxAnnee1)}`} green />
                        <Row label="Potentiel Valeur Verte / lot" value={`+ ${formatCurrency(perUnit.valeurVerteParLot)}`} green />
                    </div>

                    {/* J2 — Disclaimer Loi 65-557 Art. 10 (tantièmes) */}
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-border bg-slate-50/60 px-3 py-2.5">
                        <Scale className="w-3.5 h-3.5 text-slate flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate leading-relaxed">
                            <strong>Déficit Foncier (CGI Art. 156) :</strong> L&apos;avantage fiscal An 1 est
                            déductible du revenu global dans la limite de <strong>10 700 €/an par contribuable</strong>.
                            L&apos;excédent est reportable sur les revenus fonciers des 10 années suivantes.
                            Applicable au <strong>régime réel uniquement</strong> — bailleurs investisseurs uniquement.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Personal Simulator ─────────────────────────────── */}
            <PersonalSimulator result={result} />
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
