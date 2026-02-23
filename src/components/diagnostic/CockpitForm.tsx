"use client";

/**
 * VALO-SYNDIC — CockpitForm
 * =========================
 * Dense professional form for property managers.
 * 3 sections: Identification, Budget & Énergie, Paramètres Avancés.
 * Connected to useDiagnosticStore (Zustand).
 */

import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import { TrendingUp } from "lucide-react";
import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import MethodologieModal from "@/components/ui/MethodologieModal";
import { DPE_COLORS, type DPELetter } from "@/lib/constants";
import AdvancedDPESelector from "./AdvancedDPESelector";
import { AlertTriangle } from "lucide-react";
import { useBrandStore } from "@/stores/useBrandStore";
import { Briefcase } from "lucide-react";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-0.5 h-5 bg-navy rounded-full flex-shrink-0" />
            <h3 className="font-serif text-base font-semibold text-oxford tracking-tight">
                {children}
            </h3>
        </div>
    );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label
            htmlFor={htmlFor}
            className="block text-xs font-semibold uppercase tracking-[0.05em] text-slate-600 mb-1.5"
        >
            {children}
        </label>
    );
}

function HelperText({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[11px] text-slate-500 mt-1 leading-tight">{children}</p>
    );
}



// ─── Main Component ──────────────────────────────────────────────────────────

export default function CockpitForm() {
    const { input, updateInput, runDiagnostic, isCalculating, error, result, isDirty, setIsDirty } = useDiagnosticStore();
    const { brand, updateBrand } = useBrandStore();
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [heatingMenuOpen, setHeatingMenuOpen] = useState(false);
    const [methodologieOpen, setMethodologieOpen] = useState(false);
    const [brandingOpen, setBrandingOpen] = useState(false);

    const isValid =
        !!input.address && input.address.trim() !== "" &&
        !!input.codePostalImmeuble && input.codePostalImmeuble.length === 5 &&
        input.numberOfUnits !== undefined &&
        input.numberOfUnits >= 2 &&
        input.currentDPE !== undefined &&
        input.targetDPE !== undefined;

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            if (isValid && !isCalculating) {
                runDiagnostic();
                if (window.innerWidth >= 1024) {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                    setTimeout(() => {
                        document.getElementById("diagnostic-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 200);
                }
            }
        },
        [isValid, isCalculating, runDiagnostic]
    );

    // Auto-save disabled to allow the "Dirty" badge indicator UX to be visible
    // and to compel manual clicks for generating the analysis.

    // ── Dirty state tracking ─────────────────────────────────────────────────
    // Snapshot the input that produced the last result.
    // When the input diverges from that snapshot (and a result exists), mark dirty.
    const lastCommitRef = useRef<string | null>(null);

    // Capture the snapshot when a result is freshly produced
    useEffect(() => {
        if (result && !isCalculating) {
            lastCommitRef.current = JSON.stringify(input);
            // result just arrived — clear dirty flag
            setIsDirty(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result, isCalculating]);

    // Detect when the user changes a field AFTER a result was already displayed
    useEffect(() => {
        if (!result || !lastCommitRef.current) return;
        const currentSnapshot = JSON.stringify(input);
        if (currentSnapshot !== lastCommitRef.current) {
            setIsDirty(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input]);

    // Generic number handler — sets to undefined when empty to keep Partial<> clean
    const handleNumber = useCallback(
        (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            if (raw === "" || raw === null) {
                updateInput({ [field]: undefined });
            } else {
                const n = parseFloat(raw);
                if (!isNaN(n)) updateInput({ [field]: n });
            }
        },
        [updateInput]
    );

    // Shared input classes
    const inputCls =
        "w-full h-10 px-3 text-sm text-oxford bg-white border border-border rounded-md " +
        "placeholder:text-slate-400 " +
        "hover:border-slate-300 " +
        "focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 " +
        "transition-all duration-200";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">

            {/* ════════════════════════════════════════════════════════
               SECTION 1 — IDENTIFICATION
               ════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
                <SectionTitle>Identification</SectionTitle>

                {/* Address */}
                <div>
                    <FieldLabel htmlFor="address">Adresse</FieldLabel>
                    <input
                        id="address"
                        type="text"
                        className={inputCls}
                        placeholder="12 rue de la République, 49000 Angers"
                        value={input.address || ""}
                        onChange={(e) => updateInput({ address: e.target.value || undefined })}
                    />
                </div>

                {/* Code Postal */}
                <div>
                    <FieldLabel htmlFor="codePostalImmeuble">Code Postal</FieldLabel>
                    <input
                        id="codePostalImmeuble"
                        type="text"
                        maxLength={5}
                        pattern="\d{5}"
                        className={inputCls}
                        placeholder="75001"
                        value={input.codePostalImmeuble || ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateInput({ codePostalImmeuble: val || undefined });
                        }}
                    />
                </div>

                {/* Number of Lots */}
                <div>
                    <FieldLabel htmlFor="numberOfUnits">Nombre de lots</FieldLabel>
                    <input
                        id="numberOfUnits"
                        type="number"
                        min={2}
                        max={500}
                        className={inputCls}
                        placeholder="20"
                        value={input.numberOfUnits ?? ""}
                        onChange={handleNumber("numberOfUnits")}
                    />
                </div>

                {/* Sélecteur DPE Avancé */}
                <AdvancedDPESelector
                    currentDPE={input.currentDPE}
                    targetDPE={input.targetDPE}
                    onChangeCurrent={(dpe) => updateInput({ currentDPE: dpe })}
                    onChangeTarget={(dpe) => updateInput({ targetDPE: dpe })}
                />
            </div>

            {/* ════════════════════════════════════════════════════════
               SECTION 2 — BUDGET & ÉNERGIE
               ════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
                <div className="mb-2">
                    <SectionTitle>Budget &amp; Énergie</SectionTitle>
                </div>

                {/* Works Budget HT */}
                <div>
                    <FieldLabel htmlFor="estimatedCostHT">Budget travaux HT (€)</FieldLabel>
                    <input
                        id="estimatedCostHT"
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="350 000"
                        value={input.estimatedCostHT || ""}
                        onChange={handleNumber("estimatedCostHT")}
                    />
                    <HelperText>Laisser vide pour estimer automatiquement à 850 €/m²</HelperText>
                </div>

                {/* Annual Energy Bill */}
                <div>
                    <FieldLabel htmlFor="currentEnergyBill">Facture énergétique annuelle (€)</FieldLabel>
                    <input
                        id="currentEnergyBill"
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="45 000"
                        value={input.currentEnergyBill || ""}
                        onChange={handleNumber("currentEnergyBill")}
                    />
                </div>

                {/* Travaux d'amélioration standard (hors énergie) */}
                <div>
                    <FieldLabel htmlFor="montantTravauxAmeliorationHT">Travaux d&apos;amélioration HT (€)</FieldLabel>
                    <input
                        id="montantTravauxAmeliorationHT"
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="15 000"
                        value={input.montantTravauxAmeliorationHT ?? ""}
                        onChange={handleNumber("montantTravauxAmeliorationHT")}
                    />
                    <HelperText>Non éligible subventions. TVA 10%.</HelperText>
                </div>

                {/* Honoraires Syndic */}
                <div>
                    <FieldLabel htmlFor="montantHonorairesSyndicHT">Honoraires Syndic HT (€)</FieldLabel>
                    <input
                        id="montantHonorairesSyndicHT"
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="Vide = forfait 3%"
                        value={input.montantHonorairesSyndicHT ?? ""}
                        onChange={handleNumber("montantHonorairesSyndicHT")}
                    />
                    <HelperText>Mélange interdit avec travaux. TVA 20%.</HelperText>
                </div>

                {/* Devis Valide */}
                <div className="pt-2 pb-6">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="flex items-center h-5 mt-0.5">
                            <input
                                type="checkbox"
                                checked={input.devisValide || false}
                                onChange={(e) => updateInput({ devisValide: e.target.checked })}
                                className="h-4 w-4 rounded border-border text-navy focus:ring-navy/30 transition-shadow duration-150 cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-oxford group-hover:text-navy transition-colors">
                                Devis signé avant le 31/12/2026
                            </span>
                            <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">
                                Condition cumulative pour accès au plafond dérogatoire du Déficit Foncier (21 400 €).
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════
               SECTION 3 — PARAMÈTRES AVANCÉS (collapsible)
               ════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    onKeyDown={(e) => e.key === "Enter" && setAdvancedOpen(!advancedOpen)}
                    aria-expanded={advancedOpen}
                    className="flex items-center justify-between cursor-pointer group select-none"
                >
                    <SectionTitle>Paramètres financiers avancés</SectionTitle>
                    <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${advancedOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {advancedOpen && (
                    <div className="mt-4 space-y-4 animate-fadeInUp" style={{ animationDuration: "200ms" }}>

                        {/* Prix moyen m² */}
                        <div>
                            <FieldLabel htmlFor="averagePricePerSqm">Prix moyen m² (€)</FieldLabel>
                            <input
                                id="averagePricePerSqm"
                                type="number"
                                min={500}
                                className={inputCls}
                                placeholder="3 200"
                                value={input.averagePricePerSqm ?? ""}
                                onChange={handleNumber("averagePricePerSqm")}
                            />
                        </div>

                        {/* Surface moyenne par lot */}
                        <div>
                            <FieldLabel htmlFor="averageUnitSurface">Surface moyenne par lot (m²)</FieldLabel>
                            <input
                                id="averageUnitSurface"
                                type="number"
                                min={10}
                                className={inputCls}
                                placeholder="65"
                                value={input.averageUnitSurface ?? ""}
                                onChange={handleNumber("averageUnitSurface")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-end">
                            {/* Lots commerciaux */}
                            <div>
                                <FieldLabel htmlFor="commercialLots">Lots commerciaux</FieldLabel>
                                <input
                                    id="commercialLots"
                                    type="number"
                                    min={0}
                                    className={inputCls}
                                    placeholder="0"
                                    value={input.commercialLots ?? ""}
                                    onChange={handleNumber("commercialLots")}
                                />
                            </div>

                            {/* Fonds travaux ALUR */}
                            <div>
                                <FieldLabel htmlFor="alurFund">Fonds ALUR (€)</FieldLabel>
                                <input
                                    id="alurFund"
                                    type="number"
                                    min={0}
                                    className={inputCls}
                                    placeholder="0"
                                    value={input.alurFund ?? ""}
                                    onChange={handleNumber("alurFund")}
                                />
                            </div>
                        </div>

                        {/* Aides locales */}
                        <div>
                            <FieldLabel htmlFor="localAidAmount">Aides locales (€)</FieldLabel>
                            <input
                                id="localAidAmount"
                                type="number"
                                min={0}
                                className={inputCls}
                                placeholder="0"
                                value={input.localAidAmount ?? ""}
                                onChange={handleNumber("localAidAmount")}
                            />
                        </div>

                        {/* Heating System */}
                        <div className="relative">
                            <FieldLabel htmlFor="heatingSystem">Système de chauffage</FieldLabel>

                            {/* Custom native-like dropdown */}
                            <button
                                type="button"
                                id="heatingSystemButton"
                                onClick={() => setHeatingMenuOpen(!heatingMenuOpen)}
                                onBlur={() => setTimeout(() => setHeatingMenuOpen(false), 200)}
                                className={`${inputCls} text-left flex items-center justify-between w-full shadow-sm`}
                            >
                                <span className={input.heatingSystem ? "text-oxford" : "text-subtle/60"}>
                                    {input.heatingSystem === "electrique" ? "Électrique" :
                                        input.heatingSystem === "gaz" ? "Gaz" :
                                            input.heatingSystem === "fioul" ? "Fioul" :
                                                input.heatingSystem === "bois" ? "Bois" :
                                                    input.heatingSystem === "urbain" ? "Réseau urbain" :
                                                        input.heatingSystem === "autre" ? "Autre" : "— Non renseigné —"}
                                </span>
                                <svg className={`w-4 h-4 text-subtle transition-transform duration-200 ${heatingMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {heatingMenuOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-md shadow-lg overflow-hidden animate-fadeInUp" style={{ animationDuration: "100ms" }}>
                                    {[
                                        { val: undefined, label: "— Non renseigné —" },
                                        { val: "electrique", label: "Électrique" },
                                        { val: "gaz", label: "Gaz" },
                                        { val: "fioul", label: "Fioul" },
                                        { val: "bois", label: "Bois" },
                                        { val: "urbain", label: "Réseau urbain" },
                                        { val: "autre", label: "Autre" }
                                    ].map((opt, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                updateInput({ heatingSystem: opt.val as any });
                                                setHeatingMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-oxford hover:bg-slate-50 hover:text-navy transition-colors"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Leviers ANAH (Phase 5) ────────────────────────────── */}
                        <div className="pt-4 border-t border-border/60 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">
                                Leviers ANAH
                            </p>

                            {/* Toggle : Copropriété Fragile */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="flex items-center h-5 mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={input.isCoproFragile || false}
                                        onChange={(e) => updateInput({ isCoproFragile: e.target.checked })}
                                        className="h-4 w-4 rounded border-border text-navy focus:ring-navy/30 transition-shadow duration-150 cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-oxford group-hover:text-navy transition-colors">
                                        Copropriété fragile (+20 % MPR)
                                    </span>
                                    <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">
                                        Impayés de charges N-2 ≥ 8 % ou quartier NPNRU.
                                        ⚠️ CEE = 0 € (cession exclusive ANAH).
                                    </p>
                                </div>
                            </label>

                            {/* Toggle : Bénéficiaires MaPrimeAdapt' */}
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="flex items-center h-5 mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={input.hasBeneficiairesAdapt || false}
                                        onChange={(e) => updateInput({ hasBeneficiairesAdapt: e.target.checked })}
                                        className="h-4 w-4 rounded border-border text-navy focus:ring-navy/30 transition-shadow duration-150 cursor-pointer"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-oxford group-hover:text-navy transition-colors">
                                        Copropriétaires ≥ 70 ans (ou GIR/≥ 50 %)
                                    </span>
                                    <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">
                                        Active MaPrimeAdapt’ parties communes (+10 000 €).
                                        AMO obligatoire.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════
               SUBMIT
               ════════════════════════════════════════════════════════ */}
            <div className="pt-6">
                {error && (
                    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
                        <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-xs font-medium text-red-800 leading-tight">
                                {error}
                            </p>
                        </div>
                    </div>
                )}
                {/* ── Section Branding PDF ─────────────────────────────── */}
                <div className="border-t border-border pt-5 mt-1">
                    <button
                        type="button"
                        onClick={() => setBrandingOpen(v => !v)}
                        className="flex w-full items-center justify-between group mb-1"
                        aria-expanded={brandingOpen}
                    >
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 group-hover:text-navy transition-colors">
                                Export PDF — Branding
                            </span>
                        </div>
                        <span className={`text-slate-300 text-xs transition-transform duration-200 ${brandingOpen ? "rotate-90" : ""}`}>›</span>
                    </button>

                    {brandingOpen && (
                        <div className="mt-3 space-y-3">
                            {/* Dossier ref */}
                            <div>
                                <FieldLabel htmlFor="dossierRef">Nom du dossier / Réf. client</FieldLabel>
                                <input
                                    id="dossierRef"
                                    type="text"
                                    value={brand.dossierRef}
                                    onChange={e => updateBrand({ dossierRef: e.target.value })}
                                    placeholder="Ex : Copro Les Lilas — AG juin 2026"
                                    className={inputCls}
                                />
                            </div>
                            {/* Agency name */}
                            <div>
                                <FieldLabel htmlFor="agencyName">Cabinet / Nom du Syndic</FieldLabel>
                                <input
                                    id="agencyName"
                                    type="text"
                                    value={brand.agencyName}
                                    onChange={e => updateBrand({ agencyName: e.target.value })}
                                    placeholder="Ex : Syndic ABC"
                                    className={inputCls}
                                />
                            </div>
                            {/* Logo upload */}
                            <div>
                                <FieldLabel htmlFor="logoUpload">Logo (PNG / SVG, max 200 Ko)</FieldLabel>
                                <div className="flex items-center gap-3">
                                    {brand.logoUrl && (
                                        <img
                                            src={brand.logoUrl}
                                            alt="Logo"
                                            className="h-8 w-auto rounded border border-border object-contain bg-white p-0.5"
                                        />
                                    )}
                                    <label
                                        htmlFor="logoUpload"
                                        className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-dashed border-slate-300 text-[11px] text-slate-500 hover:border-navy/40 hover:text-navy cursor-pointer transition-colors"
                                    >
                                        {brand.logoUrl ? "🔄 Remplacer" : "📎 Ajouter un logo"}
                                        <input
                                            id="logoUpload"
                                            type="file"
                                            accept="image/png,image/svg+xml,image/jpeg"
                                            className="sr-only"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (!file || file.size > 204800) return; // 200 Ko max
                                                const reader = new FileReader();
                                                reader.onload = ev => updateBrand({ logoUrl: ev.target?.result as string });
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                    </label>
                                    {brand.logoUrl && (
                                        <button
                                            type="button"
                                            onClick={() => updateBrand({ logoUrl: null })}
                                            className="text-slate-400 hover:text-red-500 text-xs transition-colors px-1"
                                            title="Supprimer le logo"
                                        >×</button>
                                    )}
                                </div>
                                <HelperText>Appearât dans l’en-tête de l’export PDF</HelperText>
                            </div>
                        </div>
                    )}
                </div>

                {!isValid && (
                    <p className="mb-3 text-[11px] text-slate-500 text-center">
                        Renseignez l&apos;adresse, le code postal, le nombre de lots et les diagnostics.
                    </p>
                )}


                {/* ── Dirty Badge ─────────────────────────────────────────── */}
                {isDirty && result && (
                    <div className="mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 animate-pulse-subtle">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                        <span className="text-[11px] font-semibold leading-none">Calcul à mettre à jour</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!isValid || isCalculating}
                    className={`
                        w-full h-12 rounded-md text-sm font-semibold tracking-[0.04em]
                        bg-navy text-white
                        transition-all duration-200
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                        ${isValid && !isCalculating
                            ? "hover:bg-navy-dark shadow-[0_4px_14px_0_rgba(30,58,138,0.20)] active:scale-[0.99]"
                            : "opacity-40 cursor-not-allowed"
                        }
                    `}
                >
                    {isCalculating ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Analyse en cours…</span>
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <TrendingUp className="w-4 h-4" strokeWidth={2} />
                            Générer l&rsquo;Analyse Financière
                        </span>
                    )}
                </button>

                {/* Lien méthode — transparence financière */}
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => setMethodologieOpen(true)}
                        className="text-[11px] text-slate-400 hover:text-navy transition-colors underline underline-offset-2 decoration-dotted"
                    >
                        Notre méthode d&rsquo;ingénierie financière →
                    </button>
                </div>
            </div>

            <MethodologieModal isOpen={methodologieOpen} onClose={() => setMethodologieOpen(false)} />
        </form >
    );
}
