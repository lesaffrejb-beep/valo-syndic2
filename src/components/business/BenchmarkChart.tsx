"use client";

import { useMemo } from "react";
import { type DPELetter, DPE_NUMERIC_VALUE } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BenchmarkChartProps {
    currentDPE: DPELetter;
    city?: string | undefined;
    className?: string | undefined;
}

// Données benchmark Angers (Maine-et-Loire)
const REGIONAL_BENCHMARK = {
    city: "Angers",
    averageDPE: "D" as DPELetter,
    averageConsumption: 250, // kWh/m²/an
    source: "ADEME 2024",
};

// Consommation moyenne par classe DPE (kWh/m²/an)
const DPE_CONSUMPTION: Record<DPELetter, number> = {
    A: 50, B: 90, C: 150, D: 250, E: 330, F: 420, G: 500,
};


export function BenchmarkChart({ currentDPE, city = "Angers", className = "" }: BenchmarkChartProps) {
    const analysis = useMemo(() => {
        const yourConsumption = DPE_CONSUMPTION[currentDPE];
        const avgConsumption = REGIONAL_BENCHMARK.averageConsumption;
        const excessPercent = Math.round(((yourConsumption - avgConsumption) / avgConsumption) * 100);
        const isAboveAverage = excessPercent > 0;
        const yourScore = DPE_NUMERIC_VALUE[currentDPE];
        const avgScore = DPE_NUMERIC_VALUE[REGIONAL_BENCHMARK.averageDPE];
        const scoreDiff = avgScore - yourScore;

        return {
            yourConsumption,
            avgConsumption,
            excessPercent: Math.abs(excessPercent),
            isAboveAverage,
            scoreDiff,
        };
    }, [currentDPE]);

    // Pastel / Muted Colors for DPE
    const getDPEColor = (dpe: DPELetter): string => {
        const colors: Record<DPELetter, string> = {
            A: "#34D399", // Emerald-400
            B: "#86EFAC", // Green-300
            C: "#BEF264", // Lime-300
            D: "#FCD34D", // Amber-300 (Pastel Gold)
            E: "#FDBA74", // Orange-300
            F: "#FDA4AF", // Rose-300
            G: "#E07A5F", // Terracotta (was Red-400)
        };
        return colors[dpe];
    };

    const maxVal = 600;
    const yourBarWidth = Math.min((analysis.yourConsumption / maxVal) * 100, 100);
    const avgBarWidth = (analysis.avgConsumption / maxVal) * 100;

    return (
        <Card variant="glass" className={cn("border-white/5 bg-white/[0.02] group hover:border-white/10 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 border border-gold/20">
                        <BarChart3 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-medium tracking-tight text-white">Benchmark Régional</CardTitle>
                        <p className="text-xs text-muted uppercase tracking-wider mt-1">Comparaison {city}</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-8">
                {/* Visualization */}
                <div className="space-y-6">
                    {/* Your Copro */}
                    <div className="group">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm text-white font-medium">Votre Copropriété</span>
                            <div className="text-right">
                                <span className={cn("text-2xl font-light tracking-tighter financial-num", analysis.isAboveAverage ? "text-danger" : "text-success")}>
                                    {analysis.yourConsumption}
                                </span>
                                <span className="text-xs text-muted ml-1">kWh/m²</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${yourBarWidth}%`, backgroundColor: analysis.isAboveAverage ? "rgb(224, 122, 95)" : getDPEColor(currentDPE) }}
                            />
                        </div>
                    </div>

                    {/* Regional Average */}
                    <div className="group opacity-60">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm text-muted">Moyenne {city}</span>
                            <div className="text-right">
                                <span className="text-lg font-light tracking-tighter text-white/70 financial-num">
                                    {analysis.avgConsumption}
                                </span>
                                <span className="text-xs text-muted ml-1">kWh/m²</span>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out bg-gold/80"
                                style={{ width: `${avgBarWidth}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Insight / Analysis */}
                    <div className={cn(
                        "rounded-xl p-4 border flex items-start gap-3",
                        analysis.isAboveAverage
                            ? "bg-danger/5 border-danger/10"
                            : "bg-success/5 border-success/10"
                    )}>
                        {analysis.isAboveAverage ? (
                            <TrendingUp className="w-5 h-5 text-danger mt-0.5" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                        )}

                        <div className="space-y-1">
                            <p className={cn("text-sm font-medium", analysis.isAboveAverage ? "text-danger" : "text-success")}>
                                {analysis.isAboveAverage ? "Surconsommation détectée" : "Performance excellente"}
                            </p>
                        <p className="text-xs text-muted leading-relaxed">
                            {analysis.isAboveAverage
                                ? `Vous consommez ${analysis.excessPercent}% de plus que la moyenne locale. C'est un levier de valorisation immédiat.`
                                : `Vous êtes ${analysis.excessPercent}% plus efficace que la moyenne. Votre bien est attractif.`
                            }
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono">Source: {REGIONAL_BENCHMARK.source}</p>
                </div>
            </CardContent>
        </Card>
    );
}
