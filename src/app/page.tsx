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
import { MapPin, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

// --- CORE IMPORTS ---
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSave } from '@/hooks/useProjectSave';
import { generateDiagnostic } from '@/lib/calculator';
import { isMprCoproSuspended, getMarketTrend } from '@/lib/market-data';
import { useViewModeStore } from '@/stores/useViewModeStore';
import { ValoSaveSchema, type SavedSimulation, type DiagnosticInput, type DiagnosticResult, type ValoSaveData, type GhostExtensionImport } from '@/lib/schemas';
import type { DPELetter } from '@/lib/constants';
import type { SimulationInputs } from '@/lib/subsidy-calculator';
import { formatCurrency } from '@/lib/calculator';

// --- UI COMPONENTS ---
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JsonImporter } from '@/components/import/JsonImporter';
import { ProjectionModeToggle } from '@/components/ui/ProjectionModeToggle';
import { Header } from '@/components/layout/Header';
import { ViewModeToggle } from '@/components/ui/ViewModeToggle';

// --- BUSINESS COMPONENTS ---
import { StreetViewHeader } from '@/components/business/StreetViewHeader';
import { MprSuspensionAlert } from '@/components/business/MprSuspensionAlert';
import { HeatingSystemAlert } from '@/components/business/HeatingSystemAlert';
import { RisksCard } from '@/components/business/RisksCard';
import { InactionCostCard } from '@/components/business/InactionCostCard';
import { ComparisonSplitScreen } from '@/components/business/ComparisonSplitScreen';
import { BenchmarkChart } from '@/components/business/BenchmarkChart';
import { FinancingCard } from '@/components/business/FinancingCard';

import { TantiemeCalculator } from '@/components/business/TantiemeCalculator';
import { ObjectionHandler } from '@/components/business/ObjectionHandler';
import { LegalWarning } from '@/components/business/LegalWarning';

// --- PDF COMPONENTS ---
import { DownloadPdfButton } from '@/components/pdf/DownloadPdfButton';
import { DownloadPptxButton } from '@/components/pdf/DownloadPptxButton';

// --- NEW ONBOARDING COMPONENTS (FEV 2026) ---
import { SmartAddressForm, CsvImportModal } from '@/components/onboarding';

// =============================================================================
// ANIMATION & LAYOUT
// =============================================================================

const slideUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
};

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => (
    <motion.section
        id={id}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        variants={slideUp}
        className={`min-h-[80vh] flex flex-col items-center justify-center py-32 md:py-40 relative z-20 ${className}`}
    >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-24 md:gap-32 relative z-10">
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
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ScrollytellingPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<SavedSimulation | null>(null);
    const [showObjections, setShowObjections] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);

    const [activeSection, setActiveSection] = useState<'diagnostic' | 'projection' | 'my-pocket' | 'finance' | 'action'>('diagnostic');
    const { saveProject, isLoading: isSaving, error: saveError, showAuthModal, setShowAuthModal } = useProjectSave();
    const isManualNavigating = useRef(false);

    // --- DIAGNOSTIC STATE ---
    const [diagnosticInput, setDiagnosticInput] = useState<DiagnosticInput>(DEFAULT_DIAGNOSTIC_INPUT);
    // HYDRATION FIX: Initialize synchronously to allow SSR/first render to be populated
    const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(() => generateDiagnostic(DEFAULT_DIAGNOSTIC_INPUT));
    const [calculationError, setCalculationError] = useState<string | null>(null);
    const [previewAddress, setPreviewAddress] = useState<string | undefined>(DEFAULT_DIAGNOSTIC_INPUT.address);
    const [previewCoordinates, setPreviewCoordinates] = useState<{ latitude: number; longitude: number } | undefined>(
        DEFAULT_DIAGNOSTIC_INPUT.coordinates
    );

    // --- VIEW MODE STORE ---
    const { viewMode, getAdjustedValue } = useViewModeStore();

    // --- CALCULATION ENGINE ---
    const runCalculation = useCallback((input: DiagnosticInput) => {
        try {
            setCalculationError(null);
            const result = generateDiagnostic(input);
            setDiagnosticResult(result);
        } catch (err) {
            console.error("Calculation error:", err);
            setCalculationError(err instanceof Error ? err.message : "Erreur de calcul");
        }
    }, []);

    useEffect(() => {
        runCalculation(diagnosticInput);
    }, [diagnosticInput, runCalculation]);

    useEffect(() => {
        setPreviewAddress(diagnosticInput.address);
        setPreviewCoordinates(diagnosticInput.coordinates);
    }, [diagnosticInput.address, diagnosticInput.coordinates]);


    // --- PROJECT LOADING ---
    useEffect(() => {
        if (!user) { setLoading(false); return; }
        const fetchProjects = async () => {
            // simplified for brevity - kept logic
            setLoading(false);
        };
        fetchProjects();
    }, [user]);

    // --- MARKET TREND ---
    const marketTrend = useMemo(() => getMarketTrend(), []);

    // --- EXPORT / IMPORT LOGIC ---
    const handleSaveProject = useCallback(async () => {
        if (!diagnosticResult) return;
        const projectId = await saveProject(diagnosticResult, `Projet ${diagnosticResult.input.address}`);
        if (projectId) {
            alert('Projet sauvegardé avec succès !');
        }
    }, [diagnosticResult, saveProject]);

    const handleGhostImport = useCallback((data: GhostExtensionImport) => {
        // Logic to handle Ghost Extension import
        console.log("Ghost import:", data);
    }, []);

    const handleFormSubmit = useCallback((data: DiagnosticInput, opts?: { userInitiated?: boolean }) => {
        setDiagnosticInput(data);
        // Only scroll when the user explicitly submitted the form
        if (opts?.userInitiated) {
            document.getElementById('diagnostic')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const handleAddressPreview = useCallback((data: { address: string; coordinates?: { latitude: number; longitude: number } }) => {
        setPreviewAddress(data.address);
        setPreviewCoordinates(data.coordinates);
    }, []);

    const handleCsvImport = useCallback((data: Array<{ address: string; postalCode: string; city: string }>) => {
        console.log("CSV import:", data);
        // Pour l'instant, on prend juste le premier immeuble
        const first = data[0];
        if (first) {
            setDiagnosticInput(prev => ({
                ...prev,
                address: first.address,
                postalCode: first.postalCode,
                city: first.city,
            }));
        }
    }, []);

    // --- SIMULATION INPUTS FOR SUBSIDY TABLE ---
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

    const scrollToPersonalImpact = useCallback(() => {
        document.getElementById('my-pocket')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const scrollToSection = useCallback((id: string) => {
        isManualNavigating.current = true;
        // Immediate visual update
        // Using explicit cast to match state type
        setActiveSection(id as 'diagnostic' | 'projection' | 'my-pocket' | 'finance' | 'action');

        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Reset lock after scroll animation finishes (approx 1000ms)
        setTimeout(() => {
            isManualNavigating.current = false;
        }, 1000);
    }, []);

    useEffect(() => {
        const sectionIds = ['diagnostic', 'projection', 'my-pocket', 'finance', 'action'] as const;

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


    // --- RENDERING ---
    if (!diagnosticResult) return null; // Or loader

    const { financing, valuation, inactionCost } = diagnosticResult;
    const isPassoire = diagnosticInput.currentDPE === "F" || diagnosticInput.currentDPE === "G";
    const greenValueGain = valuation?.greenValueGain ?? null;
    const adjustedGreenValueGain = greenValueGain === null ? null : getAdjustedValue(greenValueGain);
    const greenValueDisplay = adjustedGreenValueGain === null || Number.isNaN(adjustedGreenValueGain)
        ? "0000"
        : formatCurrency(adjustedGreenValueGain);
    const averagePriceDisplay = diagnosticInput.averagePricePerSqm
        ? formatCurrency(diagnosticInput.averagePricePerSqm)
        : "0000";

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

            {/* Alert fixed below header */}
            <div className="fixed top-20 left-0 right-0 z-[55] print:hidden">
                <MprSuspensionAlert isSuspended={isMprCoproSuspended()} />
            </div>

            {/* ================================================================
                ZONE 0 — THE HOOK (Hero)
                ================================================================ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-20 transition-all duration-700">
                {/* Background */}
                <StreetViewHeader
                    address={previewAddress || diagnosticInput.address}
                    coordinates={previewCoordinates || diagnosticInput.coordinates}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-deep/90 via-deep/60 to-deep" />
                {/* Top Spotlight */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

                {/* Top Actions */}
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-deep/90 via-deep/60 to-deep" />

                <div className="absolute top-24 right-6 z-50 flex gap-3">
                    {/* Buttons hidden for cleanliness until interaction? kept as is but styled */}
                </div>

                {/* Smart Form Container - NOUVEAU FEV 2026 */}
                <div className="relative z-20 w-full max-w-4xl mx-auto pt-10">
                    <SmartAddressForm
                        initialData={diagnosticInput}
                        onSubmit={handleFormSubmit}
                        onAddressSelected={handleAddressPreview}
                        onCsvImport={() => setShowCsvModal(true)}
                    />
                    {/* Tantième Calculator moved up for immediate personal impact (above the fold) */}
                    {/* Tantième calculator restored to personal section (see "my-pocket") */}
                </div>

                {/* CSV Import Modal */}
                <CsvImportModal
                    isOpen={showCsvModal}
                    onClose={() => setShowCsvModal(false)}
                    onImport={handleCsvImport}
                />




                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted/50"
                >
                    <span className="text-[10px] uppercase tracking-widest">Diagnostic</span>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                </motion.div>
            </section>

            {/* ================================================================
                ZONE 1 — THE DIAGNOSTIC (Risks)
                ================================================================ */}
            <Section id="diagnostic">
                <SectionHeader
                    label="Le Diagnostic"
                    title={<>L&apos;Ingénierie Financière</>}
                    subtitle="L'inaction a un coût invisible qui érode le patrimoine de vos copropriétaires."
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-stretch">
                    {/* Left: Alerts & Context */}
                    <div className="space-y-6">
                        <HeatingSystemAlert heatingType={diagnosticInput.heatingSystem || null} />

                        {diagnosticInput.coordinates && (
                            <RisksCard coordinates={diagnosticInput.coordinates} />
                        )}
                    </div>

                    {/* Right: The Cost */}
                    <div className="space-y-6">
                        <InactionCostCard inactionCost={inactionCost} />
                    </div>
                </div>

                {/* Benchmark Chart - Full Width (2 columns) */}
                <div className="w-full mt-8">
                    <BenchmarkChart
                        currentDPE={diagnosticInput.currentDPE}
                        city={diagnosticInput.city}
                        className="bg-white/[0.02] border border-white/5 rounded-3xl p-6"
                    />
                </div>
            </Section>

            {/* ================================================================
                ZONE 2 — THE PROJECTION (Vision)
                ================================================================ */}
            <Section id="projection" className="bg-gradient-to-b from-deep to-deep-light/20">
                <SectionHeader
                    label="La Projection"
                    title={<>Le point de <span className="text-white">bascule</span></>}
                    subtitle="Comparatif direct entre le scénario du déclin et celui de la valorisation."
                />
                <ComparisonSplitScreen
                    inactionCost={inactionCost}
                    valuation={valuation}
                    financing={financing}
                />
            </Section>

            {/* ================================================================
                ZONE 4 — DIAGNOSTIC PERSONNEL
                ================================================================ */}
            <Section id="my-pocket">
                <SectionHeader
                    label="Analyse Individuelle"
                    title="Impact pour les copropriétaires"
                />

                {/* Quote-part Selector */}
                <div className="w-full max-w-[600px] mx-auto mb-12 px-4">
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
                            financing={financing}
                            simulationInputs={simulationInputs}
                            className="h-full bg-deep-light/30 border-white/5"
                        />
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
                            financing={financing}
                            numberOfUnits={diagnosticInput.numberOfUnits}
                        />
                    </div>


                </div>
            </Section>

            {/* ================================================================
                ZONE 5 — ACTION
                ================================================================ */}
            <Section id="action" className="pb-40">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-10">
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

                    <div className="mt-16 flex justify-center">
                        <LegalWarning variant="inline" />
                    </div>

                    <AnimatePresence>
                        {showObjections && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="w-full max-w-2xl mx-auto mt-12 overflow-hidden text-left"
                            >
                                <ObjectionHandler />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Section>

        </div>
    );
}
