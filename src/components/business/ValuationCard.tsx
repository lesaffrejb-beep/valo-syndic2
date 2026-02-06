"use client";

import { formatCurrency, formatPercent } from "@/lib/calculator";
import { type ValuationResult, type FinancingPlan } from "@/lib/schemas";
import { useViewModeStore } from "@/stores/useViewModeStore";
import { ShieldAlert, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ValuationCardProps {
    valuation: ValuationResult;
    financing?: FinancingPlan;
    marketTrend?: {
        national: number;
        comment?: string;
    };
    isPassoire?: boolean;
    className?: string;
}

export function ValuationCard({ valuation, financing, marketTrend, isPassoire = false, className = "" }: ValuationCardProps) {
    const { getAdjustedValue } = useViewModeStore();

    // Values
    const displayGreenValueGain = getAdjustedValue(valuation.greenValueGain);
    const displayNetROI = getAdjustedValue(valuation.netROI);
    const displayRemainingCost = financing ? getAdjustedValue(financing.remainingCost) : 0;

    // Protection Logic
    const isMarketDown = marketTrend ? marketTrend.national < 0 : false;
    const title = isMarketDown ? "Préservation de Capital" : "Valorisation & ROI";
    const accentColorClass = isMarketDown ? "text-cyan-400" : "text-success";
    const statusColor = isMarketDown ? "text-cyan-400" : (displayNetROI >= 0 ? 'text-success' : 'text-warning');
    const statusBg = isMarketDown ? "bg-cyan-400/10 border-cyan-400/20" : (displayNetROI >= 0 ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20');

    const isFullyFunded = financing ? financing.remainingCost === 0 : false;

    return (
        <Card variant="premium" className={cn("overflow-hidden group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]", className)}>
            {/* Header Section */}
            <div className="p-6 pb-4 border-b border-white/5 hover:bg-white/[0.02]">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {isMarketDown ? <ShieldAlert className="w-5 h-5 text-white" /> : <TrendingUp className="w-5 h-5 text-white" />}
                            {title}
                        </h3>
                        <p className="text-sm text-muted mt-1">
                            {isMarketDown ? "Sécurisation de votre actif immobilier" : "Impact financier de la rénovation"}
                        </p>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest", statusBg, statusColor)}>
                        {isMarketDown ? 'Sécurisé' : (displayNetROI >= 0 ? 'Rentable' : 'Effort Requis')}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <CardContent className="p-6 space-y-6">

                {/* 1. La Valeur Verde */}
                <div className="relative z-10 bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner transition-all group-hover:bg-black/50">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.25em] text-muted font-bold mb-1">
                                {isMarketDown ? "Capital Protégé" : "Plus-Value Latente"}
                            </span>
                            <span className="text-[9px] font-mono text-white/30">Estimation Etalab 2026</span>
                        </div>
                        <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1", statusBg, statusColor)}>
                            {isMarketDown ? <ShieldAlert className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {isMarketDown ? 'ANTI-DÉCOTE' : `+${formatPercent(valuation.greenValueGainPercent)}`}
                        </div>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className={cn("text-5xl lg:text-6xl font-sans font-light tracking-tighter leading-none financial-nums", accentColorClass)}>
                            +{formatCurrency(displayGreenValueGain)}
                        </span>
                    </div>
                </div>

                {/* Market Context */}
                {isMarketDown && marketTrend && (
                    <div className="bg-warning/5 border border-warning/10 rounded-xl p-4 flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                            <BarChart3 className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                            <p className="text-warning/80 font-bold uppercase tracking-widest text-[9px] mb-1">Contexte marché</p>
                            <p className="text-[11px] text-muted leading-relaxed">
                                Tendance : <span className="text-warning font-bold financial-nums">{(marketTrend.national * 100).toFixed(1)}%</span>.
                                {isPassoire && " Sans rénovation, votre bien subit cette baisse + la décote passoire énergétique."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-4 opacity-30">
                    <div className="h-px flex-1 bg-white/20" />
                    <span className="text-[9px] uppercase tracking-[0.3em] font-mono whitespace-nowrap">Net de Travaux</span>
                    <div className="h-px flex-1 bg-white/20" />
                </div>

                {/* 2. Le Net (ROI) */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">
                            Gain Net Réel
                        </p>
                        <p className="text-[9px] text-white/20 font-mono italic">
                            (Plus-value - Reste à charge)
                        </p>
                    </div>

                    <div className={cn("text-right font-bold text-3xl tracking-tighter financial-nums", displayNetROI >= 0 ? 'text-white' : 'text-warning')}>
                        {displayNetROI >= 0 ? '+' : ''}{formatCurrency(displayNetROI)}
                    </div>
                </div>

                {/* Context Hint */}
                {financing && !isFullyFunded && (
                    <div className="flex justify-between items-center text-[10px] font-mono px-2 text-muted/50">
                        <span>Coût travaux déduit :</span>
                        <span className="font-bold">-{formatCurrency(displayRemainingCost)}</span>
                    </div>
                )}
            </CardContent>

            {/* Footer Source */}
            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 text-[10px] text-muted flex justify-between items-center uppercase tracking-wider">
                <span>{valuation.salesCount ? `${valuation.salesCount} ventes analysées` : 'Estimation théorique'}</span>
                <span className="opacity-50">Source : {valuation.priceSource || 'Etalab DVF'}</span>
            </div>
        </Card>
    );
}
