/**
 * VALO-SYNDIC — Homepage "Wealth Management" Scrollytelling
 * =====================================================
 * Design Philosophy: "More Air, Less Noise"
 * - Deep Space Background
 * - Glassmorphism Surfaces
 * - Gold & Terracotta Accents
 * - JetBrains Mono for Data
 * - Lucide Icons only (No Emojis)
 */

"use client";

import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

// --- CORE IMPORTS ---
import { useAuth } from '@/hooks/useAuth';
import { useProjectSave } from '@/hooks/useProjectSave';
import { generateDiagnostic } from '@/lib/calculator';
import { getMarketTrend } from '@/lib/market-data';
import { useViewModeStore } from '@/stores/useViewModeStore';
import { type SavedSimulation, type DiagnosticInput, type DiagnosticResult, type GhostExtensionImport } from '@/lib/schemas';
import type { DPELetter } from '@/lib/constants';
import type { SimulationInputs } from '@/lib/subsidy-calculator';
import { formatCurrency } from '@/lib/calculator';
import type { HybridSearchResult } from "@/services/dpeService";

// --- UI COMPONENTS ---
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { ViewModeToggle } from '@/components/ui/ViewModeToggle';

// --- BUSINESS COMPONENTS ---
import { StreetViewHeader } from '@/components/business/StreetViewHeader';
import { ComparisonSplitScreen } from '@/components/business/ComparisonSplitScreen';
import { BenchmarkChart } from '@/components/business/BenchmarkChart';
import { FinancingCard } from '@/components/business/FinancingCard';

import { TantiemeCalculator } from '@/components/business/TantiemeCalculator';
import { ObjectionHandler } from '@/components/business/ObjectionHandler';
import { LegalWarning } from '@/components/business/LegalWarning';
import { AuditSearchForm } from '@/components/business/AuditSearchForm';
import { DiagnosticForm } from '@/components/business/form/DiagnosticForm';

// --- PDF COMPONENTS ---
import { DownloadPdfButton } from '@/components/pdf/DownloadPdfButton';
import { DownloadPptxButton } from '@/components/pdf/DownloadPptxButton';

// --- NEW ONBOARDING COMPONENTS (FEV 2026) ---
import { CsvImportModal } from '@/components/onboarding';

// =============================================================================
// ANIMATION & LAYOUT
// =============================================================================

const slideUp = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
    <motion.section
        id={id}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        variants={slideUp}
        className={`min-h-[80vh] flex flex-col items-center justify-center py-20 md:py-40 relative z-20 ${className}`}
    >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-12 md:gap-32 relative z-10">
            {children}
        </div>
    </motion.section>
);

const SectionHeader = ({ label, title, subtitle }: { label: string; title: string | ReactNode; subtitle?: string }) => (
    <div className="text-center max-w-3xl mx-auto">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gold/80 mb-4 block">{label}</span>
        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
            {title}
        </h2>
        {subtitle && <p className="text-muted text-lg leading-relaxed">{subtitle}</p>}
    </div>
);


// =============================================================================
// DEFAULT INPUT VALUES
// =============================================================================

const DEFAULT_DIAGNOSTIC_INPUT: DiagnosticInput = {
    address: "12 Rue de la Paix, 49000 Angers",
    postalCode: "49000",
    city: "Angers",
    coordinates: { latitude: 47.4784, longitude: -0.5632 },
    currentDPE: "F" as DPELetter,
    targetDPE: "C" as DPELetter,
    numberOfUnits: 20,
    commercialLots: 0,
    estimatedCostHT: 400000,
    averagePricePerSqm: 3200,
    priceSource: "Etalab DVF",
    salesCount: 12,
    averageUnitSurface: 65,
    localAidAmount: 10000,
    alurFund: 0,
    ceeBonus: 40000,
    currentEnergyBill: 0,
    investorRatio: 30,
    isCostTTC: true,
    includeHonoraires: true,
};

// --- SERVICES ---
import { initAudit, completeAudit, mapBackendToFrontend, type AuditFlashResult } from '@/services/auditService';
import { FileText } from "lucide-react";

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ScrollytellingPage() {
    const { user } = useAuth();
    // const [loading, setLoading] = useState(true); // Unused for now
    const [showObjections, setShowObjections] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);

    const [activeSection, setActiveSection] = useState<'diagnostic' | 'analyse' | 'finance' | 'action'>('diagnostic');
    const { saveProject, isLoading: isSaving, showAuthModal, setShowAuthModal } = useProjectSave();
    const isManualNavigating = useRef(false);

    // --- AUDIT FLOW STATE ---
    const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'form_open' | 'success'>('idle');
    const [tempAuditId, setTempAuditId] = useState<string | null>(null);
    // Données pré-remplies depuis l'API (pour le formulaire déroulant)
    const [prefillData, setPrefillData] = useState<Partial<DiagnosticInput> | null>(null);

    // --- DIAGNOSTIC STATE ---
    const [diagnosticInput, setDiagnosticInput] = useState<DiagnosticInput>(DEFAULT_DIAGNOSTIC_INPUT);
    // HYDRATION FIX: Initialize synchronously to allow SSR/first render to be populated
    const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(() => generateDiagnostic(DEFAULT_DIAGNOSTIC_INPUT));

    useEffect(() => {
        console.log("Audit Page Mounted - Version Fix 2");
    }, []);

    // Callback de reset pour le formulaire de recherche
    const handleResetSearch = () => {
        setAuditStatus('idle');
        setPrefillData(null);
    };

    const [previewAddress, setPreviewAddress] = useState<string | undefined>(DEFAULT_DIAGNOSTIC_INPUT.address);
    const [previewCoordinates, setPreviewCoordinates] = useState<{ latitude: number; longitude: number } | undefined>(
        DEFAULT_DIAGNOSTIC_INPUT.coordinates
    );

    // --- VIEW MODE STORE ---
    const { getAdjustedValue } = useViewModeStore();

    // --- CALCULATION ENGINE ---
    // Note: In the new flow, calculation is driven by the API response, 
    // but we keep this for manual adjustments if needed later.
    const runCalculation = useCallback((input: DiagnosticInput) => {
        try {
            const result = generateDiagnostic(input);
            setDiagnosticResult(result);
        } catch (err) {
            console.error("Calculation error:", err);
        }
    }, []);

    // --- NEW AUDIT FLOW HANDLERS ---

    const handleAuditInit = async (address: string, result: HybridSearchResult) => {
        setAuditStatus('loading');
        setPreviewAddress(address);
        if (result.coordinates) setPreviewCoordinates(result.coordinates);

        try {
            const response = await initAudit(address);

            if (response.status === 'COMPLETED') {
                // MAPPING BACKEND -> FRONTEND
                // @ts-ignore - response.result is AuditFlashResult, mapping utility handles it
                const mappedResult = mapBackendToFrontend(response.result as AuditFlashResult);

                setDiagnosticResult(mappedResult);
                setDiagnosticInput(mappedResult.input);
                setAuditStatus('success');
                setTimeout(() => scrollToSection('diagnostic'), 500);
            } else if (response.status === 'MANUAL_REQ') {
                // NOUVEAU FLOW: on ouvre le formulaire pré-rempli au lieu du modal
                const apiData = (response as any).prefillData || {};
                setTempAuditId(response.tempId || "");

                // Mapper les données API vers le format DiagnosticInput
                // CRITICAL FIX: Map ALL available fields, not just basic ones
                const prefill: Partial<DiagnosticInput> = {
                    // Address data
                    address: apiData.address || address,
                    postalCode: apiData.postalCode || '',
                    city: apiData.city || '',
                    coordinates: apiData.coordinates || result.coordinates,

                    // Golden Data from APIs (with proper fallbacks)
                    currentDPE: apiData.currentDPE || undefined,
                    targetDPE: 'C' as DPELetter, // Toujours C par défaut

                    // Property details
                    numberOfUnits: apiData.numberOfUnits || undefined,
                    averagePricePerSqm: apiData.pricePerSqm || undefined, // CRITICAL: was missing before
                    averageUnitSurface: apiData.surfaceHabitable && apiData.numberOfUnits
                        ? Math.round(apiData.surfaceHabitable / apiData.numberOfUnits)
                        : undefined,

                    // Financial estimates
                    estimatedCostHT: apiData.surfaceHabitable
                        ? Math.round(apiData.surfaceHabitable * 400) // 400€/m² estimation
                        : 300000, // Fallback

                    // Optional enrichment
                    priceSource: apiData.sources?.includes('DVF') ? 'DVF Etalab' : undefined,
                };

                setPrefillData(prefill);
                setAuditStatus('form_open');
            } else {
                // ERROR - mais on ouvre quand même le formulaire vide
                console.warn("Audit Init Warning:", response);
                setPrefillData({
                    address: address,
                    coordinates: result.coordinates,
                    postalCode: result.postalCode || '',
                    city: result.city || '',
                    targetDPE: 'C' as DPELetter,
                    estimatedCostHT: 300000,
                    numberOfUnits: 20, // Default reasonable value
                });
                setAuditStatus('form_open');
            }
        } catch (error) {
            console.error("Audit Init Exception:", error);
            // Même en cas d'erreur, on ouvre le formulaire avec les données minimales
            setPrefillData({
                address: address,
                coordinates: result.coordinates,
                postalCode: result.postalCode || '',
                city: result.city || '',
                targetDPE: 'C' as DPELetter,
                estimatedCostHT: 300000,
                numberOfUnits: 20,
            });
            setAuditStatus('form_open');
        }
    };

    const handleGhostImport = useCallback((data: GhostExtensionImport) => {
        console.log("Ghost import:", data);
        // Implement Ghost import logic here if needed
    }, []);

    const handleSaveProject = useCallback(async () => {
        if (!diagnosticResult) return;
        const projectId = await saveProject(diagnosticResult, `Projet ${diagnosticResult.input.address}`);
        if (projectId) {
            alert('Projet sauvegardé avec succès !');
        }
    }, [diagnosticResult, saveProject]);

    const handleCsvImport = useCallback((data: Array<{ address: string; postalCode: string; city: string }>) => {
        console.log("CSV import:", data);
        const first = data[0];
        if (first) {
            // Trigger audit flow for the first imported address
            // Ideally we would loop or ask user, but for now let's just create a dummy result for the first one
            setDiagnosticInput(prev => ({
                ...prev,
                address: first.address,
                postalCode: first.postalCode,
                city: first.city,
            }));
            // Trigger init manually if needed or just let user click
        }
    }, []);

    // --- SCROLL & NAV ---

    const scrollToSection = useCallback((id: string) => {
        isManualNavigating.current = true;
        setActiveSection(id as 'diagnostic' | 'analyse' | 'finance' | 'action');
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            isManualNavigating.current = false;
        }, 1000);
    }, []);

    // Handler quand le formulaire est soumis
    const handleFormSubmit = useCallback((data: DiagnosticInput) => {
        setAuditStatus('loading');
        try {
            // Lancer le calcul avec les données soumises
            const result = generateDiagnostic(data);
            setDiagnosticResult(result);
            setDiagnosticInput(data);
            setAuditStatus('success');
            setPrefillData(null); // Fermer le formulaire
            setTimeout(() => scrollToSection('diagnostic'), 500);
        } catch (error) {
            console.error("Diagnostic calculation error:", error);
            alert("Erreur de calcul. Vérifiez les données.");
            setAuditStatus('form_open');
        }
    }, [scrollToSection]);

    useEffect(() => {
        const sectionIds = ['diagnostic', 'analyse', 'finance', 'action'] as const;
        const observer = new IntersectionObserver(
            (entries) => {
                if (isManualNavigating.current) return;
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRect.height - a.intersectionRect.height);
                const top = visible[0];
                const id = top?.target?.id as typeof sectionIds[number] | undefined;
                if (id) setActiveSection(id);
            },
            {
                root: null,
                threshold: [0, 0.1, 0.5],
                rootMargin: '-45% 0px -45% 0px',
            }
        );
        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);


    // --- SIMULATION INPUTS FOR TANTIEME ---
    const simulationInputs: SimulationInputs = useMemo(() => {
        if (!diagnosticResult) return { workAmountHT: 0, amoAmountHT: 0, nbLots: diagnosticInput.numberOfUnits, energyGain: 0, initialDPE: diagnosticInput.currentDPE, targetDPE: diagnosticInput.targetDPE, ceePerLot: 0, localAidPerLot: 0 };
        const { financing } = diagnosticResult;
        return {
            workAmountHT: financing.worksCostHT,
            amoAmountHT: financing.totalCostHT - financing.worksCostHT - financing.syndicFees - financing.doFees - financing.contingencyFees,
            nbLots: diagnosticInput.numberOfUnits,
            energyGain: financing.energyGainPercent,
            initialDPE: diagnosticInput.currentDPE,
            targetDPE: diagnosticInput.targetDPE,
            ceePerLot: (diagnosticInput.ceeBonus || 0) / diagnosticInput.numberOfUnits,
            localAidPerLot: (diagnosticInput.localAidAmount || 0) / diagnosticInput.numberOfUnits,
        };
    }, [diagnosticResult, diagnosticInput]);

    // --- RENDERING VARS ---
    const greenValueGain = diagnosticResult?.valuation?.greenValueGain ?? null;
    const adjustedGreenValueGain = greenValueGain === null ? null : getAdjustedValue(greenValueGain);
    const greenValueDisplay = adjustedGreenValueGain === null || Number.isNaN(adjustedGreenValueGain)
        ? "0000"
        : formatCurrency(adjustedGreenValueGain);


    return (
        <div className="min-h-screen font-sans selection:bg-gold/30 selection:text-gold-light bg-deep text-white overflow-hidden">
            <Header
                onOpenBranding={() => { }}
                onSave={handleSaveProject}
                onImport={handleGhostImport}
                hasResult={!!diagnosticResult}
                onOpenAuth={() => setShowAuthModal(true)}
                activeSection={activeSection}
                onNavigate={scrollToSection}
                isSaving={isSaving}
            />

            {/* ================================================================
                ZONE 0 — THE HOOK (Hero)
                ================================================================ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-20 transition-all duration-700">

                <StreetViewHeader
                    address={previewAddress || diagnosticInput.address}
                    coordinates={previewCoordinates || diagnosticInput.coordinates}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-deep/90 via-deep/60 to-deep" />

                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

                {/* Main Audit Form Container */}
                <div className="relative z-20 w-full max-w-4xl mx-auto pt-10">
                    <AuditSearchForm
                        onAuditInit={handleAuditInit}
                        onReset={handleResetSearch}
                        isLoading={auditStatus === 'loading'}
                    />
                </div>

                <AnimatePresence>
                    {auditStatus === 'form_open' && prefillData && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                            className="relative z-20 w-full max-w-3xl mx-auto mt-8 overflow-hidden"
                        >
                            <div className="card-premium bg-black/40 backdrop-blur-2xl border-white/10 shadow-2xl hover:translate-y-0 hover:bg-black/40 hover:border-white/10 hover:shadow-2xl transition-none">
                                {/* Header Formulaire */}
                                <div className="p-8 pb-0 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shadow-neon">
                                            <FileText className="w-5 h-5 text-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white tracking-tight">Finalisez l&apos;analyse</h3>
                                            <p className="text-sm text-muted">Vérifiez les données ci-dessous pour un résultat précis</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <DiagnosticForm
                                        onSubmit={handleFormSubmit}
                                        initialData={prefillData}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CSV Import Modal (kept for manual trigger if needed, though hidden nicely now) */}
                <CsvImportModal
                    isOpen={showCsvModal}
                    onClose={() => setShowCsvModal(false)}
                    onImport={handleCsvImport}
                />

                {/* Scroll Indicator (Only show if we have results/success) */}
                {auditStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted/50 cursor-pointer"
                        onClick={() => scrollToSection('diagnostic')}
                    >
                        <span className="text-[10px] uppercase tracking-widest">Voir le Diagnostic</span>
                        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    </motion.div>
                )}
            </section>

            {/* ================================================================
                ZONE 1 — THE DIAGNOSTIC (Benchmark + Projection)
                ================================================================ */}
            {diagnosticResult && (
                <>
                    <Section id="diagnostic">
                        <SectionHeader
                            label="Le Diagnostic"
                            title={<>Ingénierie & <span className="text-white">Bascule</span></>}
                            subtitle="Comparatif direct entre le marché actuel, le scénario du déclin et la valorisation."
                        />

                        <div className="w-full space-y-12">
                            {/* 1. Benchmark Chart (Top) */}
                            <div className="w-full">
                                <BenchmarkChart
                                    currentDPE={diagnosticInput.currentDPE}
                                    city={diagnosticInput.city}
                                    className="bg-white/[0.02] border border-white/5 rounded-3xl p-6"
                                />
                            </div>

                            {/* 2. Comparison Grid (Bottom) */}
                            <ComparisonSplitScreen
                                inactionCost={diagnosticResult.inactionCost}
                                valuation={diagnosticResult.valuation}
                                financing={diagnosticResult.financing}
                            />
                        </div>
                    </Section>

                    {/* ================================================================
                    ZONE 2 — ANALYSE INDIVIDUELLE (Ex-My Pocket)
                    ================================================================ */}
                    <Section id="analyse">
                        <SectionHeader
                            label="Analyse Individuelle"
                            title="Impact pour les copropriétaires"
                        />

                        <div className="w-full flex flex-col gap-8">
                            {/* Quote-part Selector */}
                            <div className="w-full max-w-[600px] mx-auto px-4">
                                <div className="text-center mb-4">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-gold/60 font-semibold">Votre quote-part</span>
                                </div>
                                <ViewModeToggle
                                    totalUnits={diagnosticInput.numberOfUnits}
                                    avgSurface={diagnosticInput.averageUnitSurface || 65}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                <Card className="md:col-span-2 border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl">
                                    <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/80 font-semibold">Valeur verte estimée</p>
                                            <p className="text-sm text-white/70 mt-2">Valorisation patrimoniale directement issue du moteur de calcul.</p>
                                        </div>
                                        <div className="text-4xl md:text-5xl font-light text-emerald-300 tracking-tighter financial-num">
                                            +{greenValueDisplay}
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="md:col-span-2">
                                    <TantiemeCalculator
                                        financing={diagnosticResult.financing}
                                        simulationInputs={simulationInputs}
                                        className="h-full bg-deep-light/30 border-white/5"
                                    />
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ================================================================
                    ZONE 3 — THE FINANCING (Logic)
                    ================================================================ */}
                    <Section id="finance">
                        <SectionHeader
                            label="L'Ingénierie Financière"
                            title={<>Trésorerie Positive <span className="text-white">immédiate</span></>}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
                            <div className="xl:col-span-12">
                                <FinancingCard
                                    financing={diagnosticResult.financing}
                                    numberOfUnits={diagnosticInput.numberOfUnits}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ================================================================
                    ZONE 5 — ACTION
                    ================================================================ */}
                    <Section id="action" className="pb-40">
                        <div className="max-w-4xl mx-auto text-center space-y-12">
                            <div className="space-y-10">
                                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                                    Passez à l&apos;<span className="text-gold">action</span>.
                                </h2>

                                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                    <Button
                                        variant="outline"
                                        className="h-16 px-8 rounded-full border-white/10 hover:bg-white/5 text-white gap-3 transition-all duration-300"
                                        onClick={() => setShowObjections(!showObjections)}
                                    >
                                        <AlertTriangle className="w-5 h-5 text-muted" />
                                        <span className="font-semibold">Contrer les objections</span>
                                    </Button>

                                    <DownloadPdfButton
                                        result={diagnosticResult}
                                        className="h-16 px-10 rounded-full bg-gold hover:bg-gold-light text-black font-bold text-lg transition-all duration-300 flex items-center gap-3"
                                    />

                                    <DownloadPptxButton
                                        result={diagnosticResult}
                                        className="h-16 px-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <LegalWarning variant="inline" />
                            </div>

                            <AnimatePresence>
                                {showObjections && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="w-full max-w-2xl mx-auto overflow-hidden text-left"
                                    >
                                        <ObjectionHandler />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Section>
                </>
            )}

        </div>
    );
}
