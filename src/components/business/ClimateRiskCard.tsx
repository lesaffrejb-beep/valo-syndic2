"use client";

import { useEffect, useState } from "react";
import { getClimateProjection, type ClimateProjection } from "@/actions/getClimateData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";

interface ClimateRiskCardProps {
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

/**
 * CLIMATE TIME BOMB - Projection 2050 (RCP 8.5)
 * Design Updated: Premium Obsidian / Space Black Aesthetic
 */
export const ClimateRiskCard = ({ coordinates }: ClimateRiskCardProps) => {
    const [projection, setProjection] = useState<ClimateProjection | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!coordinates) {
            setProjection(null);
            return;
        }

        setLoading(true);
        getClimateProjection(coordinates.latitude, coordinates.longitude)
            .then(setProjection)
            .finally(() => setLoading(false));
    }, [coordinates]);

    // Pas de coordonnées = pas d'affichage
    if (!coordinates) {
        return null;
    }

    // Loading state
    if (loading) {
        return (
            <div className="card-bento animate-pulse h-full min-h-[400px] group hover:border-white/10 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                <div className="flex justify-between mb-8">
                    <div className="h-8 bg-surface-hover rounded w-1/3" />
                    <div className="h-8 bg-surface-hover rounded w-12" />
                </div>
                <div className="flex justify-center mb-12">
                    <div className="h-24 bg-surface-hover rounded-full w-24" />
                </div>
                <div className="h-40 bg-surface-hover rounded-xl w-full" />
            </div>
        );
    }

    // Pas de données
    if (!projection) {
        return (
            <div className="card-bento h-full flex items-center justify-center group hover:border-white/10 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col items-center gap-2 text-muted text-sm">
                    <span className="text-2xl">☁️</span>
                    <span>Données climatiques indisponibles pour cette zone</span>
                </div>
            </div>
        );
    }

    // Préparer les données pour le chart
    const chartData = generateClimateData(
        projection.current.avgSummerTemp,
        projection.future2050.avgSummerTemp
    );

    const heatDaysIncrease = projection.future2050.heatDays - projection.current.heatDays;
    const isExtremeRisk = projection.future2050.uninhabitableDays > 10;

        return (
            <motion.div
                className="card-bento h-full relative overflow-hidden group hover:border-white/10 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        <span className="text-xl">🌡️</span>
                        <span className="text-white">
                            Climate Time Bomb
                        </span>
                    </h3>
                    <p className="text-xs text-muted font-medium tracking-wide uppercase">
                        Horizon 2050 • Scénario RCP 8.5 (Pessimiste)
                    </p>
                </div>
                {isExtremeRisk && (
                    <div className="px-3 py-1 rounded-full bg-danger/10 border border-danger/20 text-danger text-xs font-bold animate-pulse">
                        RISQUE EXTRÊME
                    </div>
                )}
            </div>

            {/* Main Stats Row */}
            <div className="relative z-10 grid grid-cols-2 gap-8 mb-8">
                {/* Metric 1: Jours Inhabitables */}
                <div className="text-center">
                    <div className="text-5xl lg:text-6xl font-black text-danger mb-2 tracking-tighter drop-shadow-lg shadow-danger/20">
                        {projection.future2050.uninhabitableDays}
                    </div>
                    <p className="text-sm font-bold text-main">Jours critique / an</p>
                    <p className="text-xs text-muted mt-1">Température {'>'} 35°C (Danger)</p>
                </div>

                {/* Metric 2: Augmentation Canicule */}
                <div className="text-center flex flex-col justify-center">
                    <div className="text-3xl lg:text-4xl font-bold text-warning mb-2 tracking-tight">
                        +{heatDaysIncrease}
                        <span className="text-lg ml-1 text-warning/70">jours</span>
                    </div>
                    <p className="text-sm font-bold text-main">de canicule tropicale</p>
                    <p className="text-xs text-muted mt-1">Nuits {'>'} 25°C (Insomnie)</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative z-10 h-[220px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-surface-highlight border border-boundary rounded-lg p-3 shadow-xl">
                                            <p className="text-xs text-muted mb-1">{payload[0].payload.year}</p>
                                            <p className="text-sm font-bold text-main">
                                                {payload[0].value}°C Moy. Été
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            dy={10}
                        />
                        <YAxis
                            hide={true}
                            domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Area
                            type="monotone"
                            dataKey="temp"
                            stroke="#EF4444"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorTemp)"
                        />
                        <ReferenceLine y={chartData[0]?.temp ?? 0} stroke="#374151" strokeDasharray="3 3" />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="absolute top-2 left-4 text-xs text-white/40 font-mono">
                    +{((chartData[chartData.length - 1]?.temp ?? 0) - (chartData[0]?.temp ?? 0)).toFixed(1)}°C vs 2020
                </div>
            </div>

            {/* Verdict Box */}
            <div className="relative z-10 bg-surface-highlight border border-boundary rounded-xl p-4">
                <div className="flex gap-3">
                    <div className="text-2xl">🏚️</div>
                    <div>
                        <p className="text-sm font-bold text-main mb-1">
                            Votre toiture n&apos;est pas prête.
                        </p>
                        <p className="text-xs text-muted leading-relaxed">
                            En 2050, le climat de votre ville ressemblera à celui de <strong className="text-primary-400">{projection.similarCity}</strong> aujourd&apos;hui.
                            Sans isolation, les étages supérieurs deviendront invendables.
                        </p>
                    </div>
                </div>
            </div>

            {/* Source */}
            <div className="absolute bottom-3 right-4 text-[10px] text-white/20">
                Data: {projection.dataSource}
            </div>
        </motion.div>
    );
};

function generateClimateData(currentTemp: number, futureTemp: number) {
    const years = [2020, 2025, 2030, 2035, 2040, 2045, 2050];
    const totalDelta = futureTemp - currentTemp;

    return years.map(year => {
        // Courbe exponentielle pour le scénario RCP 8.5
        const progress = (year - 2020) / 30;
        const curve = Math.pow(progress, 2); // accélération
        const temp = currentTemp + (totalDelta * curve);

        return {
            year,
            temp: Number(temp.toFixed(1))
        };
    });
}
