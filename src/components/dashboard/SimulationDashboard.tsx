"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";

// Structural Components
import { SubsidyTable } from "@/components/business/SubsidyTable";

// [NEW] Data Reveal Features
import { DPEDistributionChart } from "@/components/dashboard/DPEDistributionChart";
import { HeatingSystemAlert } from "@/components/business/HeatingSystemAlert";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Feature Components
import { DiagnosticForm } from "@/components/business/form/DiagnosticForm";
import { ComplianceTimeline } from "@/components/ComplianceTimeline";
import { FinancingCard } from "@/components/business/FinancingCard";
import { InactionCostCard } from "@/components/business/InactionCostCard";
import { ComparisonSplitScreen } from "@/components/business/ComparisonSplitScreen";
import { LegalWarning } from "@/components/business/LegalWarning";
import { EnergyInflationChart } from "@/components/EnergyInflationChart";
import { DPEGauge } from "@/components/DPEGauge";
import { FinancingBreakdownChart } from "@/components/business/charts/FinancingBreakdownChart";

import { UrgencyScore } from "@/components/UrgencyScore";

// Persuasion Components
import { TantiemeCalculator } from "@/components/business/TantiemeCalculator";
import { MarketBenchmark } from "@/components/business/MarketBenchmark";

import { ValuationCard } from "@/components/business/ValuationCard";
import { InvestorTaxCard } from "@/components/business/InvestorTaxCard";

import { StaggerContainer } from "@/components/ui/AnimatedCard";

// V3 Premium Components
import { StreetViewHeader } from "@/components/business/StreetViewHeader";
import { RisksCard } from "@/components/business/RisksCard";
import { ClimateRiskCard } from "@/components/business/ClimateRiskCard";

// God View
import { MassAudit } from "@/components/business/MassAudit";

// Core Logic
import { simulateDiagnostic } from "@/app/actions/simulate";
import { type DiagnosticInput, type DiagnosticResult, DiagnosticInputSchema, type GhostExtensionImport } from "@/lib/schemas";
import { type SimulationInputs } from "@/lib/subsidy-calculator";
import { BrandingModal } from "@/components/BrandingModal";
import { getLocalRealEstatePrice } from "@/actions/getRealEstateData";
import { AuthModal } from "@/components/auth/AuthModal";
import { useProjectSave } from "@/hooks/useProjectSave";
import { type MarketData } from "@/lib/market-data";
import { JsonImporter } from "@/components/import/JsonImporter";

// NEW Premium Components
import { MprSuspensionAlert } from "@/components/business/MprSuspensionAlert";
import { TransparentReceipt } from "@/components/business/TransparentReceipt";
import { MarketLiquidityAlert } from "@/components/business/MarketLiquidityAlert";

// Lazy Loaded Components
const DownloadPdfButton = dynamic(
    () => import('@/components/pdf/DownloadPdfButton').then(mod => mod.DownloadPdfButton),
    { ssr: false, loading: () => <BtnLoading /> }
);

interface SimulationDashboardProps {
    marketData: MarketData;
}

export function SimulationDashboard({ marketData }: SimulationDashboardProps) {
    const [result, setResult] = useState<DiagnosticResult | null>(null);
    const [currentInput, setCurrentInput] = useState<DiagnosticInput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"flash" | "mass">("flash");
    const [showBrandingModal, setShowBrandingModal] = useState(false);

    // Authentication & Save
    const { saveProject, isLoading: isSaving, showAuthModal, setShowAuthModal } = useProjectSave();
    const [saveSuccess, setSaveSuccess] = useState(false);

    // --- Property Data Management ---
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    // ----------------------------------------------

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load simulation from session storage
    useEffect(() => {
        const loadedData = sessionStorage.getItem('valo_loaded_simulation');
        if (loadedData) {
            try {
                const { input, result: loadedResult } = JSON.parse(loadedData);
                setCurrentInput(input);
                setResult(loadedResult);
                sessionStorage.removeItem('valo_loaded_simulation');
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }, 100);
            } catch (err) {
                console.error('Failed to load simulation from session:', err);
            }
        }
    }, []);

    const handleSubmit = async (data: DiagnosticInput) => {
        setIsLoading(true);
        setCurrentInput(data);

        let enrichedData = { ...data };

        if (data.coordinates) {
            try {
                const realEstateData = await getLocalRealEstatePrice(
                    data.coordinates.latitude,
                    data.coordinates.longitude
                );

                if (realEstateData) {
                    enrichedData = {
                        ...enrichedData,
                        averagePricePerSqm: realEstateData.averagePriceSqm,
                        priceSource: "DVF (Etalab)",
                        salesCount: realEstateData.salesCount,
                    };
                }
            } catch (error) {
                console.error("Failed to fetch market data", error);
            }
        }

        setTimeout(async () => {
            const response = await simulateDiagnostic(enrichedData);

            if (!response.success) {
                alert(`Erreur de calcul: ${response.error}`);
                setIsLoading(false);
                return;
            }

            setResult(response.data);
            setIsLoading(false);
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }, 100);
        }, 500);
    };

    const handleSave = () => {
        if (!result || !currentInput) return;

        const saveData = {
            version: "1.0",
            savedAt: new Date().toISOString(),
            input: currentInput,
            result: result,
        };

        const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `valo-syndic_${currentInput.city || "simulation"}_${new Date().toISOString().split("T")[0]}.valo`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e: ProgressEvent<FileReader>) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                const validatedInput = DiagnosticInputSchema.parse(data.input);
                setCurrentInput(validatedInput);

                const response = await simulateDiagnostic(validatedInput);
                if (!response.success) {
                    alert(`Erreur de calcul: ${response.error}`);
                    return;
                }

                setResult(response.data);
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }, 100);
            } catch (err) {
                console.error("Erreur chargement fichier:", err);
                alert("Fichier invalide. Vérifiez le format .valo");
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    const handleGhostImport = (data: GhostExtensionImport) => {
        const totalTantiemes = data.lots.reduce((sum, lot) => sum + lot.tantiemes, 0);
        const stats = `✅ ${data.lots.length} lots importés !\n\nTotal Tantièmes: ${totalTantiemes}\n\nSource: ${data.url || 'Extension Ghost'}`;
        alert(stats);

        if (!result) {
            document.getElementById('diagnostic-form')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSaveToCloud = async () => {
        if (!result) return;

        const projectName = result.input.city
            ? `Simulation ${result.input.city}`
            : 'Nouvelle simulation';

        const savedId = await saveProject(result, projectName);

        if (savedId) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const simulationInputs: SimulationInputs | undefined = result ? {
        workAmountHT: result.financing.worksCostHT,
        amoAmountHT: result.financing.amoAmount,
        nbLots: result.input.numberOfUnits,
        energyGain: result.financing.energyGainPercent,
        initialDPE: result.input.currentDPE,
        targetDPE: result.input.targetDPE,
        isFragile: false,
        ceePerLot: result.input.ceeBonus,
        localAidPerLot: result.input.localAidAmount
    } : undefined;

    return (
        <div className="min-h-screen bg-app">
            <MprSuspensionAlert isSuspended={marketData.regulation.isMprCoproSuspended} />

            <BrandingModal isOpen={showBrandingModal} onClose={() => setShowBrandingModal(false)} />
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    if (result) {
                        handleSaveToCloud();
                    }
                }}
            />

            <Header
                onOpenBranding={() => setShowBrandingModal(true)}
                onSave={handleSave}
                onLoad={handleLoad}
                hasResult={!!result}
                fileInputRef={fileInputRef}
                onOpenAuth={() => setShowAuthModal(true)}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
                {/* Mode Selector */}
                {!result && (
                    <div className="flex justify-center mb-12">
                        <div className="p-1 bg-surface border border-boundary rounded-xl flex gap-1">
                            <button
                                onClick={() => setActiveTab("flash")}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "flash"
                                    ? "bg-primary-900 text-primary-400 shadow-glow border border-primary-500/30"
                                    : "text-muted hover:text-main"
                                    }`}
                            >
                                ⚡ Diagnostic Flash
                            </button>
                            <button
                                onClick={() => setActiveTab("mass")}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "mass"
                                    ? "bg-primary-900 text-primary-400 shadow-glow border border-primary-500/30"
                                    : "text-muted hover:text-main"
                                    }`}
                            >
                                🌐 Audit de Parc
                            </button>
                        </div>
                    </div>
                )}

                {/* Hero Section Flash */}
                {!result && activeTab === "flash" && (
                    <section className="mb-12">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-main mb-4 tracking-tight">
                                Ne gérez plus des charges.
                                <br />
                                <span className="text-gradient">Pilotez un investissement.</span>
                            </h2>
                            <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                                Votre diagnostic patrimonial de copropriété en temps réel.
                                Révélez le potentiel financier caché derrière la rénovation énergétique.
                            </p>
                        </div>

                        <div id="diagnostic-form" className="card-bento p-8 md:p-12 mb-12 shadow-none rounded-3xl group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                            <div className="w-full max-w-4xl mx-auto">
                                <h3 className="text-center text-main font-semibold mb-8">
                                    Simulateur de Valorisation & Subventions
                                </h3>

                                <div className="animate-fade-in-up">
                                    <DiagnosticForm
                                        onSubmit={handleSubmit}
                                        isLoading={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center mt-12 pt-8 border-t border-white/5">
                                <div className="flex flex-col items-center gap-2">
                                    <JsonImporter onImport={handleGhostImport} />
                                </div>
                            </div>
                        </div>

                        <LegalWarning variant="footer" className="mt-8" />
                    </section>
                )}

                {/* Hero Section Mass Audit */}
                {!result && activeTab === "mass" && (
                    <section className="mb-12">
                        <MassAudit />
                        <LegalWarning variant="footer" className="mt-8" />
                    </section>
                )}

                {/* Results Section */}
                <AnimatePresence mode="wait">
                    {result && simulationInputs && (
                        <motion.section
                            id="results"
                            className="space-y-16"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <StaggerContainer staggerDelay={0.1} className="flex flex-col gap-24 md:gap-32">

                                {/* ACTE 1: LE DIAGNOSTIC */}
                                <div className="space-y-8">
                                    {result.input.coordinates && (
                                        <StreetViewHeader
                                            address={result.input.address || undefined}
                                            coordinates={result.input.coordinates}
                                        />
                                    )}

                                    <div className="card-bento p-8 md:p-10 gap-8 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 flex-wrap gap-y-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-xs font-semibold rounded-full uppercase tracking-wider text-muted">
                                                        Diagnostic Vital
                                                    </span>
                                                </div>
                                                <h2 className="text-3xl md:text-4xl font-black text-main mb-2 tracking-tight">
                                                    État des Lieux
                                                </h2>
                                                <p className="text-muted">
                                                    {result.input.address && `${result.input.address}, `}
                                                    {result.input.city} • {result.input.numberOfUnits} lots
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full pt-8 border-t border-boundary/50 mt-8">
                                            <DPEGauge currentDPE={result.input.currentDPE} targetDPE={result.input.targetDPE} />
                                            {selectedProperty && (
                                                <div className="mt-8">
                                                    <DPEDistributionChart
                                                        userDPE={(selectedProperty.dpeData?.etiquette_dpe || result.input.currentDPE)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <ComplianceTimeline
                                            currentDPE={result.input.currentDPE}
                                            className="w-full"
                                        />
                                    </div>
                                </div>


                                {/* ACTE 2: LE COÛT */}
                                <div className="space-y-8">
                                    <div className="text-center max-w-2xl mx-auto mb-8">
                                        <span className="text-danger-400 font-bold uppercase tracking-widest text-xs mb-3 block animate-pulse">
                                            Le Coût de l&apos;Inaction
                                        </span>
                                        <h2 className="text-3xl md:text-5xl font-black text-main leading-tight">
                                            L&apos;immobilisme vous coûte <br />
                                            <span className="text-danger">de l&apos;argent chaque jour.</span>
                                        </h2>
                                    </div>

                                    <ComparisonSplitScreen
                                        inactionCost={result.inactionCost}
                                        valuation={result.valuation}
                                        financing={result.financing}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                        <div className="h-full flex flex-col opacity-80 hover:opacity-100 transition-opacity">
                                            <EnergyInflationChart currentCost={result.inactionCost.currentCost} />
                                        </div>
                                        <div className="h-full">
                                            <RisksCard
                                                coordinates={result.input.coordinates ?? undefined}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ACTE 3: LA VALEUR */}
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                        <div className="md:col-span-8">
                                            <ValuationCard
                                                valuation={result.valuation}
                                                financing={result.financing}
                                                marketTrend={marketData.marketTrend}
                                                isPassoire={['F', 'G'].includes(result.input.currentDPE)}
                                            />
                                        </div>
                                        <div className="md:col-span-4 h-full">
                                            <MarketLiquidityAlert shareOfSales={marketData.passoires.shareOfSales} />
                                        </div>
                                    </div>
                                </div>


                                {/* ACTE 4: LA RÉVÉLATION */}
                                <div className="space-y-8">
                                    <div className="text-center max-w-3xl mx-auto mb-8">
                                        <span className="px-3 py-1 bg-gradient-to-r from-primary-900/50 to-primary-800/20 border border-primary-500/30 rounded-full text-xs font-bold text-primary-300 uppercase tracking-wider mb-4 inline-block">
                                            Ingénierie Financière
                                        </span>
                                        <h2 className="text-3xl md:text-5xl font-black text-main leading-none mb-6">
                                            Le Financement
                                        </h2>
                                        <p className="text-lg text-muted">
                                            Notre algorithme a détecté les aides spécifiques à votre copropriété.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
                                        <div className="md:col-span-12">
                                            {selectedProperty && (
                                                <div className="mb-6">
                                                    <HeatingSystemAlert
                                                        heatingType={selectedProperty.dpeData?.type_energie || 'gaz'}
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                                <div className="lg:col-span-7">
                                                    <SubsidyTable inputs={simulationInputs} />
                                                </div>
                                                <div className="lg:col-span-5">
                                                    <TransparentReceipt financing={result.financing} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-12 card-obsidian min-h-[400px]">
                                            <h3 className="text-xl font-bold text-main mb-6 flex items-center gap-2">
                                                🌍 Financement Global
                                            </h3>
                                            <FinancingBreakdownChart financing={result.financing} />
                                        </div>
                                    </div>
                                </div>


                                {/* ACTE 5: L'INDIVIDUALISATION */}
                                <div className="space-y-8 pb-12">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                        <div>
                                            <h2 className="text-3xl font-black text-main mb-2">Projection Individuelle</h2>
                                            <p className="text-muted text-lg">Simulez le reste à charge précis par copropriétaire.</p>
                                        </div>
                                    </div>

                                    <div className="w-full">
                                        <TantiemeCalculator
                                            financing={result.financing}
                                            simulationInputs={simulationInputs}
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-8 border-t border-white/5">
                                        <div className="w-full max-w-md flex flex-col gap-4">
                                            <DownloadPdfButton result={result} />
                                            <button
                                                onClick={handleSaveToCloud}
                                                className="w-full py-3 rounded-xl text-sm font-semibold border border-boundary/50 hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
                                            >
                                                <span>💾</span>
                                                Sauvegarder le projet
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <LegalWarning variant="banner" className="mt-8" />
                            </StaggerContainer>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            <Footer
                onSave={handleSave}
                onLoad={() => fileInputRef.current?.click()}
                hasResult={!!result}
            />
        </div>
    );
}

const BtnLoading = () => (
    <div className="btn-secondary opacity-50 cursor-not-allowed flex items-center gap-2">
        ⏳ <span className="hidden sm:inline">Chargement...</span>
    </div>
);
