"use client";

/**
 * VALO-SYNDIC — CockpitForm
 * =========================
 * Dense professional form for property managers.
 * 3 sections: Identification, Budget & Énergie, Paramètres Avancés.
 * Connected to useDiagnosticStore (Zustand).
 */

import { useState, useCallback, type FormEvent } from "react";
import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import type { DPELetter } from "@/lib/constants";

// ─── DPE Color Map (muted institutional) ─────────────────────────────────────
type DPEStyle = { bg: string; bgActive: string; text: string; border: string };

const DPE_COLORS: Record<DPELetter, DPEStyle> = {
    A: { bg: "bg-emerald-50", bgActive: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200" },
    B: { bg: "bg-lime-50", bgActive: "bg-lime-600", text: "text-lime-700", border: "border-lime-200" },
    C: { bg: "bg-yellow-50", bgActive: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-200" },
    D: { bg: "bg-amber-50", bgActive: "bg-amber-500", text: "text-amber-700", border: "border-amber-200" },
    E: { bg: "bg-orange-50", bgActive: "bg-orange-500", text: "text-orange-700", border: "border-orange-200" },
    F: { bg: "bg-red-50", bgActive: "bg-red-500", text: "text-red-700", border: "border-red-200" },
    G: { bg: "bg-red-100", bgActive: "bg-red-700", text: "text-red-800", border: "border-red-300" },
};

const ALL_DPE: DPELetter[] = ["A", "B", "C", "D", "E", "F", "G"];
const TARGET_DPE: DPELetter[] = ["A", "B", "C", "D", "E"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="font-serif text-lg font-semibold text-oxford tracking-tight">
            {children}
        </h3>
    );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label
            htmlFor={htmlFor}
            className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate mb-1.5"
        >
            {children}
        </label>
    );
}

function HelperText({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] text-subtle mt-1 leading-tight">{children}</p>
    );
}

function DPESelector({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: DPELetter[];
    value: DPELetter | undefined;
    onChange: (dpe: DPELetter) => void;
}) {
    return (
        <fieldset>
            <legend className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate mb-2">
                {label}
            </legend>
            <div className="flex gap-1">
                {options.map((dpe) => {
                    const isActive = value === dpe;
                    const colors = DPE_COLORS[dpe];
                    return (
                        <button
                            key={dpe}
                            type="button"
                            onClick={() => onChange(dpe)}
                            aria-pressed={isActive}
                            className={`
                                flex-1 h-9 rounded-md text-xs font-bold
                                border transition-all duration-150
                                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-navy focus-visible:ring-offset-1
                                ${isActive
                                    ? `${colors.bgActive} text-white border-transparent shadow-sm`
                                    : `${colors.bg} ${colors.text} ${colors.border} hover:border-slate-300`
                                }
                            `}
                        >
                            {dpe}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CockpitForm() {
    const { input, updateInput, runDiagnostic, isCalculating, error } = useDiagnosticStore();
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const isValid = !!(input.numberOfUnits && input.numberOfUnits >= 2 && input.currentDPE && input.targetDPE);

    const handleSubmit = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            if (isValid && !isCalculating) {
                runDiagnostic();
            }
        },
        [isValid, isCalculating, runDiagnostic]
    );

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
        "placeholder:text-subtle/60 " +
        "hover:border-border-strong " +
        "focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 " +
        "transition-colors duration-150";

    return (
        <form onSubmit={handleSubmit} className="space-y-0">

            {/* ════════════════════════════════════════════════════════
               SECTION 1 — IDENTIFICATION
               ════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
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
                        placeholder="Ex : 75001"
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

                {/* Current DPE */}
                <DPESelector
                    label="DPE actuel"
                    options={ALL_DPE}
                    value={input.currentDPE}
                    onChange={(dpe) => updateInput({ currentDPE: dpe })}
                />

                {/* Target DPE */}
                <DPESelector
                    label="DPE cible après travaux"
                    options={TARGET_DPE}
                    value={input.targetDPE}
                    onChange={(dpe) => updateInput({ targetDPE: dpe })}
                />

                {/* DPE Projeté */}
                <DPESelector
                    label="DPE projeté (Déficit Foncier LdF 2026)"
                    options={ALL_DPE}
                    value={input.dpeProjete}
                    onChange={(dpe) => updateInput({ dpeProjete: dpe })}
                />
            </div>

            <hr className="border-border my-6" />

            {/* ════════════════════════════════════════════════════════
               SECTION 2 — BUDGET & ÉNERGIE
               ════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
                <SectionTitle>Budget &amp; Énergie</SectionTitle>

                {/* Works Budget HT */}
                <div>
                    <FieldLabel htmlFor="estimatedCostHT">Budget travaux HT (€)</FieldLabel>
                    <input
                        id="estimatedCostHT"
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="Ex : 350 000"
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
                        placeholder="Ex : 45 000"
                        value={input.currentEnergyBill || ""}
                        onChange={handleNumber("currentEnergyBill")}
                    />
                </div>

                {/* Travaux d'amélioration standard (hors énergie) */}
                <div>
                    <FieldLabel htmlFor="montantTravauxAmeliorationHT">Travaux d'amélioration HT (€)</FieldLabel>
                    <input
                        id="montantTravauxAmeliorationHT"
                        type="number"
                        min={0}
                        className={inputCls}
                        placeholder="Ex : 15 000"
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
                <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={input.devisValide || false}
                            onChange={(e) => updateInput({ devisValide: e.target.checked })}
                            className="h-4 w-4 rounded border-border text-navy focus:ring-navy/30"
                        />
                        <span className="text-sm font-medium text-oxford">
                            Devis signé avant le 31/12/2026
                        </span>
                    </label>
                    <HelperText>Condition cumulative pour accès au plafond dérogatoire du Déficit Foncier (21 400 €).</HelperText>
                </div>
            </div>

            <hr className="border-border my-6" />

            {/* ════════════════════════════════════════════════════════
               SECTION 3 — PARAMÈTRES AVANCÉS (collapsible)
               ════════════════════════════════════════════════════════ */}
            <div>
                <button
                    type="button"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    className="w-full flex items-center justify-between py-1 group"
                    aria-expanded={advancedOpen}
                >
                    <SectionTitle>Paramètres avancés</SectionTitle>
                    <svg
                        className={`w-4 h-4 text-subtle transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

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

                        <div className="grid grid-cols-2 gap-3">
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
                        <div>
                            <FieldLabel htmlFor="heatingSystem">Système de chauffage</FieldLabel>
                            <select
                                id="heatingSystem"
                                className={`${inputCls} appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat`}
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    paddingRight: "2.75rem",
                                }}
                                value={input.heatingSystem || ""}
                                onChange={(e) =>
                                    updateInput({
                                        heatingSystem: (e.target.value || undefined) as
                                            | "electrique" | "gaz" | "fioul" | "bois" | "urbain" | "autre"
                                            | undefined,
                                    })
                                }
                            >
                                <option value="">— Non renseigné —</option>
                                <option value="electrique">Électrique</option>
                                <option value="gaz">Gaz</option>
                                <option value="fioul">Fioul</option>
                                <option value="bois">Bois</option>
                                <option value="urbain">Réseau urbain</option>
                                <option value="autre">Autre</option>
                            </select>
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
                <button
                    type="submit"
                    disabled={!isValid || isCalculating}
                    className={`
                        w-full h-12 rounded-md text-sm font-semibold tracking-wide
                        transition-all duration-150
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                        ${isValid && !isCalculating
                            ? "bg-navy text-white hover:bg-navy-light active:bg-navy-dark shadow-sm hover:shadow-md"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }
                    `}
                >
                    {isCalculating ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Analyse en cours via Serveur…
                        </span>
                    ) : (
                        "Générer l\u2019Analyse Financière"
                    )}
                </button>
            </div>
        </form>
    );
}
