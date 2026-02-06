/**
 * VALO-SYNDIC — Market Benchmark Component
 * =========================================
 * Displays local market intelligence comparison (Hive Mind)
 * Premium Obsidian design with micro-interactions
 */

"use client";

import { useEffect, useState } from "react";
import { getLocalBenchmarks, type BenchmarkResult } from "@/actions/getMarketStats";
import type { DPELetter } from "@/lib/constants";

interface MarketBenchmarkProps {
    postalCode: string;
    currentDPE: DPELetter;
    targetDPE: DPELetter;
    userPricePerSqm: number;
}

export function MarketBenchmark({
    postalCode,
    currentDPE,
    targetDPE,
    userPricePerSqm,
}: MarketBenchmarkProps) {
    const [benchmark, setBenchmark] = useState<BenchmarkResult>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchBenchmark() {
            setIsLoading(true);
            const result = await getLocalBenchmarks(postalCode, currentDPE, targetDPE);
            setBenchmark(result);
            setIsLoading(false);
        }

        fetchBenchmark();
    }, [postalCode, currentDPE, targetDPE]);

    // Loading state
    if (isLoading) {
        return (
            <div className="card-bento p-6 opacity-50 animate-pulse group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                <div className="h-4 bg-surface-highlight rounded w-3/4 mb-3" />
                <div className="h-8 bg-surface-highlight rounded w-1/2" />
            </div>
        );
    }

    // Insufficient data state
    if (!benchmark) {
        return (
            <div className="card-bento p-6 border-boundary transition-all duration-500 hover:border-white/10 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🛠️</span>
                    <div>
                        <p className="text-sm font-semibold text-muted mb-1">
                            Calibrage de l&apos;Intelligence Collective en cours...
                        </p>
                        <p className="text-xs text-subtle">
                            Pas encore assez de données fiables dans votre zone pour cette transition DPE
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate comparison
    const diff = ((userPricePerSqm - benchmark.averagePrice) / benchmark.averagePrice) * 100;
    const diffRounded = Math.round(Math.abs(diff));

    // Determine comparison style
    let comparisonIcon: string;
    let comparisonText: string;
    let comparisonColor: string;
    let comparisonBg: string;

    if (diff < -5) {
        // Below market - Good for owner
        comparisonIcon = "✓";
        comparisonText = `Votre projet est ${diffRounded}% sous la moyenne marché`;
        comparisonColor = "text-success-500";
        comparisonBg = "bg-success-50";
    } else if (diff > 5) {
        // Above market - Warning
        comparisonIcon = "⚠️";
        comparisonText = `Votre projet est +${diffRounded}% au-dessus de la moyenne`;
        comparisonColor = "text-warning-500";
        comparisonBg = "bg-warning-50";
    } else {
        // Aligned with market
        comparisonIcon = "≈";
        comparisonText = "Votre projet est aligné avec le marché local";
        comparisonColor = "text-muted";
        comparisonBg = "bg-surface-highlight";
    }

    return (
        <div
            className="card-bento p-6 transition-all duration-500 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] animate-fadeIn animate-delay-100"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🧠</span>
                <h3 className="label-technical">Oracle - Intelligence Collective</h3>
            </div>

            {/* Market Average */}
            <div className="mb-4">
                <p className="text-2xl font-bold text-main tabular-nums mb-1">
                    {benchmark.averagePrice.toLocaleString("fr-FR")} €/m²
                </p>
                <p className="text-xs text-subtle">
                    Prix marché local (basé sur{" "}
                    <span className="font-medium text-muted">{benchmark.sampleSize} projets</span> similaires)
                </p>
            </div>

            {/* Comparison Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${comparisonBg} transition-colors`}>
                <span className="text-sm">{comparisonIcon}</span>
                <span className={`text-sm font-medium ${comparisonColor}`}>
                    {comparisonText}
                </span>
            </div>

            {/* Subtext */}
            <p className="text-xs text-subtle mt-3 italic">
                Données anonymisées • DPE {currentDPE} → {targetDPE} • CP {postalCode}
            </p>
        </div>
    );
}
