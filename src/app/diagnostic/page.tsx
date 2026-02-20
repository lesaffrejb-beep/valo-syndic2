"use client";

/**
 * VALO-SYNDIC — Diagnostic Page
 * =============================
 * Dual-mode: Pilotage (form + results) / Presentation (projector view).
 */

import CockpitForm from "@/components/diagnostic/CockpitForm";
import DiagnosticResults from "@/components/diagnostic/DiagnosticResults";
import PresentationView from "@/components/diagnostic/PresentationView";
import { useDiagnosticStore } from "@/stores/useDiagnosticStore";
import { Monitor, LayoutDashboard } from "lucide-react";
import { DownloadPdfButton } from "@/components/pdf/DownloadPdfButton";

export default function DiagnosticPage() {
    const { viewMode, setViewMode, result } = useDiagnosticStore();

    // ── Presentation Mode ────────────────────────────────────
    if (viewMode === "presentation") {
        return (
            <div className="relative">
                {/* Exit button — top-right */}
                <button
                    type="button"
                    onClick={() => setViewMode("pilotage")}
                    className="fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-md
                               bg-white/80 backdrop-blur border border-border text-xs font-semibold text-slate
                               hover:bg-white hover:text-oxford transition-colors duration-150 shadow-sm"
                >
                    <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Pilotage
                </button>
                <PresentationView />
            </div>
        );
    }

    // ── Pilotage Mode (default) ──────────────────────────────
    return (
        <main className="min-h-screen bg-alabaster">
            {/* ── Page Header ───────────────────────────────────────── */}
            <header className="border-b border-border bg-card">
                <div className="container-custom py-6 md:py-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-baseline gap-3">
                                <h1 className="text-3xl md:text-4xl font-serif font-bold text-oxford">
                                    Diagnostic Patrimonial
                                </h1>
                                <span className="label-technical text-brass">ANAH 2026</span>
                            </div>
                            <p className="mt-2 text-sm text-slate font-sans max-w-2xl">
                                Simulation complète de votre plan de valorisation : conformité réglementaire,
                                ingénierie financière MaPrimeRénov&#39; Copropriété, et projection patrimoniale.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {result && (
                                <DownloadPdfButton
                                    result={result}
                                    className="px-4 py-2.5 rounded-md bg-brass text-white text-xs font-semibold hover:bg-brass-light transition-colors duration-150 shadow-sm"
                                />
                            )}
                            {/* View Mode Toggle */}
                            <button
                                type="button"
                                onClick={() => setViewMode("presentation")}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-md
                                           border border-border bg-white text-xs font-semibold text-slate
                                           hover:bg-navy hover:text-white hover:border-navy
                                           transition-colors duration-150 shadow-sm"
                                title="Mode Présentation AG"
                            >
                                <Monitor className="w-4 h-4" strokeWidth={1.5} />
                                <span className="hidden sm:inline">Présentation</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Grid Layout ───────────────────────────────────────── */}
            <div className="container-custom py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* ── Left Column: Cockpit Form ──────────────────── */}
                    <aside className="lg:col-span-4">
                        <div className="card card-content lg:sticky lg:top-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-6 bg-brass rounded-full" />
                                <h2 className="text-xl font-serif font-semibold text-oxford">
                                    Paramètres
                                </h2>
                            </div>
                            <CockpitForm />
                        </div>
                    </aside>

                    {/* ── Right Column: Results ──────────────────────── */}
                    <section className="lg:col-span-8">
                        <DiagnosticResults />
                    </section>

                </div>
            </div>
        </main >
    );
}
