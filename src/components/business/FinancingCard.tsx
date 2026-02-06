"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { BenchmarkBadge } from "@/components/ui/BenchmarkBadge";
import {
    loadBenchmarks,
    evaluateCostPerLotSync,
    type BenchmarkData,
    type BenchmarkResult,
} from "@/lib/services/marketBenchmarkService";
import { type FinancingPlan } from "@/lib/schemas";
import { formatPercent, formatCurrency } from "@/lib/calculator";
import { AnimatedCurrency } from "@/components/ui/AnimatedNumber";
import { Landmark, Zap, MapPin, HandCoins, Building2 } from "lucide-react";
import { useViewModeStore } from "@/stores/useViewModeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinancingCardProps {
    financing: FinancingPlan;
    numberOfUnits: number;
}

export function FinancingCard({ financing, numberOfUnits }: FinancingCardProps) {
    const { viewMode, getAdjustedValue } = useViewModeStore();
    const isMaPoche = viewMode === 'maPoche';

    // Market Watchdog
    const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
    const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);

    useEffect(() => {
        loadBenchmarks().then((data) => {
            if (data) setBenchmarkData(data);
        });
    }, []);

    useEffect(() => {
        if (benchmarkData && numberOfUnits > 0 && financing.worksCostHT > 0) {
            const result = evaluateCostPerLotSync(
                financing.worksCostHT,
                numberOfUnits,
                benchmarkData
            );
            setBenchmarkResult(result);
        }
    }, [benchmarkData, financing.worksCostHT, numberOfUnits]);

    return (
        <Card variant="premium" className="h-full overflow-hidden group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

            <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                        <HandCoins className="w-5 h-5 text-white" />
                    </div>
                    <span>Plan de Financement</span>
                </CardTitle>
                <p className="text-sm text-muted">Structure des coûts et aides mobilisables</p>
            </CardHeader>

            <CardContent className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pt-6">
                {/* Colonne GAUCHE : La Facture */}
                <div className="flex flex-col h-full border-b md:border-b-0 md:border-r border-white/5 md:pr-8 pb-8 md:pb-0">
                    <div className="mb-6 space-y-4">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Détail du Projet</p>

                        {/* Travaux Seuls */}
                        <div className="flex justify-between items-baseline group/item">
                            <p className="text-sm text-muted-foreground group-hover/item:text-white transition-colors">Travaux de rénovation (HT)</p>
                            <p className="text-white font-medium financial-nums"><AnimatedCurrency value={financing.worksCostHT} /></p>
                        </div>

                        {/* Frais Annexes */}
                        <div className="space-y-3 pl-4 border-l border-white/5">
                            <div className="flex justify-between text-sm text-muted">
                                <span>Honoraires Syndic (3%)</span>
                                <span className="financial-nums"><AnimatedCurrency value={financing.syndicFees} /></span>
                            </div>
                            <div className="flex justify-between text-sm text-muted">
                                <span>Assurance DO (2%)</span>
                                <span className="financial-nums"><AnimatedCurrency value={financing.doFees} /></span>
                            </div>
                            <div className="flex justify-between text-sm text-muted">
                                <span>Aléas (3%)</span>
                                <span className="financial-nums"><AnimatedCurrency value={financing.contingencyFees} /></span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-gold/80 font-bold uppercase text-[10px] tracking-widest">Total Projet</p>
                                    <p className="text-[10px] text-muted">Avant aides</p>
                                </div>
                                <p className="text-3xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent tracking-tight financial-nums">
                                    <AnimatedCurrency value={financing.totalCostHT} />
                                </p>
                            </div>
                            {/* Market Watchdog Badge */}
                            {benchmarkResult && (
                                <div className="mt-3 flex items-center justify-between">
                                    <BenchmarkBadge
                                        status={benchmarkResult.status}
                                        label={benchmarkResult.label}
                                    />
                                    <p className="text-[10px] text-muted text-right">
                                        Soit <span className="text-white font-medium">{formatCurrency(financing.costPerUnit)}</span> / lot
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Colonne DROITE : Le Financement */}
                <div className="flex flex-col h-full">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-6">Solutions de Financement</p>

                    <div className="space-y-3 flex-1">
                        {/* MaPrimeRénov' */}
                        <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-xl border border-blue-500/30 shadow-sm relative overflow-hidden group/mpr">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Landmark className="w-4 h-4 text-blue-200" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">MaPrimeRénov&apos;</p>
                                    <p className="text-[10px] text-blue-200/60">
                                        {formatPercent(financing.mprRate)} socle collectif
                                    </p>
                                </div>
                            </div>
                            <span className="text-base font-bold text-blue-100 financial-nums relative z-10">
                                -<AnimatedCurrency value={financing.mprAmount} />
                            </span>
                            <div className="absolute inset-0 bg-blue-500/5 group-hover/mpr:bg-blue-500/10 transition-colors" />
                        </div>

                        {/* CEE */}
                        {financing.ceeAmount > 0 && (
                            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-900/30 rounded-lg border border-amber-500/30">
                                        <Zap className="w-4 h-4 text-amber-200" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Primes CEE</p>
                                        <p className="text-[10px] text-muted">Certificats Énergie</p>
                                    </div>
                                </div>
                                <span className="text-base font-bold text-success financial-nums">
                                    -<AnimatedCurrency value={financing.ceeAmount} />
                                </span>
                            </div>
                        )}

                        {/* Local Aid */}
                        {financing.localAidAmount > 0 && (
                            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Aides Locales</p>
                                        <p className="text-[10px] text-muted">Collectivités</p>
                                    </div>
                                </div>
                                <span className="text-base font-bold text-success financial-nums">
                                    -<AnimatedCurrency value={financing.localAidAmount} />
                                </span>
                            </div>
                        )}

                        {/* Éco-PTZ */}
                        <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:border-gold/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gold/10 rounded-lg border border-gold/10">
                                    <Building2 className="w-4 h-4 text-gold" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">Éco-PTZ Copro</p>
                                    <p className="text-[10px] text-muted">Taux 0% • Durée 20 ans</p>
                                </div>
                            </div>
                            <span className="text-base font-bold text-white financial-nums">
                                <AnimatedCurrency value={financing.ecoPtzAmount} />
                            </span>
                        </div>
                    </div>

                    {/* Reste à Charge & Mensualité */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6 min-w-0">
                            <div className="w-full sm:w-auto">
                                <p className="text-xs text-muted mb-1 uppercase tracking-wide">
                                    Reste à charge {isMaPoche ? '(votre part)' : 'final'}
                                </p>
                                <p className="text-5xl md:text-6xl font-black text-gold financial-nums financial-nums tracking-tighter">
                                    <AnimatedCurrency value={getAdjustedValue(financing.remainingCost)} />
                                </p>
                                <p className="text-[10px] text-muted mt-1 opacity-70">
                                    (Après subventions)
                                </p>
                            </div>

                            <div className="text-right w-full sm:w-auto">
                                <div className="inline-flex flex-col items-end p-3 bg-white/[0.05] rounded-xl border border-white/10 shadow-lg w-full sm:w-auto min-w-0">
                                    <span className="text-[10px] text-gold/80 font-bold uppercase tracking-wider mb-1">
                                        Mensualité {isMaPoche ? 'estimée' : 'Copro'}
                                    </span>
                                    <span className="text-2xl font-bold text-white financial-nums financial-nums">
                                        <span className="whitespace-nowrap">
                                            <AnimatedCurrency value={getAdjustedValue(financing.monthlyPayment)} />
                                            <span className="text-sm font-normal text-muted ml-1">/mois</span>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Gain Énergétique */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-white/5 flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 hover:bg-success/20 transition-colors">
                        <span className="text-[10px] font-bold text-success uppercase tracking-wider">⚡ Gain énergétique projeté</span>
                        <span className="text-sm font-black text-success financial-nums">
                            -{Math.round(financing.energyGainPercent * 100)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
