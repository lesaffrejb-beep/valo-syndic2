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
                <div className="container-custom py-5 md:py-7">
                    <div className="flex items-center justify-between gap-6">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-serif font-bold text-oxford tracking-tight">
                                    Diagnostic Patrimonial
                                </h1>
                                <span className="px-2.5 py-0.5 rounded border border-navy/30 bg-slate-50 text-navy text-[10px] font-bold uppercase tracking-widest flex-shrink-0">ANAH 2026</span>
                            </div>
                            <p className="mt-1.5 text-xs text-slate font-sans">
                                Ingénierie financière copropriété <span className="text-navy mx-1">·</span> MaPrimeRénov&apos; <span className="text-navy mx-1">·</span> Éco-PTZ <span className="text-navy mx-1">·</span> CEE <span className="text-navy mx-1">·</span> Déficit Foncier
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {result && (
                                <DownloadPdfButton
                                    result={result}
                                    className="flex items-center justify-center gap-2 px-4 h-9 rounded-md border-border border bg-white text-navy text-[11px] font-bold uppercase tracking-wider hover:border-navy/30 hover:bg-slate-50 transition-all duration-200 shadow-sm"
                                />
                            )}
                            {/* View Mode Toggle */}
                            <button
                                type="button"
                                onClick={() => setViewMode("presentation")}
                                className="flex-shrink-0 flex items-center justify-center gap-2 px-4 h-9 rounded-md border-border border bg-white text-navy text-[11px] font-bold uppercase tracking-wider hover:border-navy/30 hover:bg-slate-50 transition-all duration-200 shadow-sm"
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
                    <aside className="lg:col-span-4 lg:sticky lg:top-8 lg:self-start z-10">
                        <div className="card card-content">
                            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-border">
                                <div className="w-0.5 h-5 bg-navy rounded-full" />
                                <h2 className="text-base font-serif font-semibold text-oxford tracking-tight">
                                    Paramètres de la copropriété
                                </h2>
                            </div>
                            <CockpitForm />
                        </div>
                    </aside>

                    {/* ── Right Column: Results ──────────────────────── */}
                    <section id="diagnostic-results" className="lg:col-span-8">
                        <DiagnosticResults />
                    </section>

                </div>
            </div>
        </main >
    );
}
