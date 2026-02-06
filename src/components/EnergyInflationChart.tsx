/**
 * EnergyInflationChart — "La Courbe de la Peur"
 * =============================================
 * Visualisation de l'inflation des coûts de travaux sur 5 ans.
 * Design néo-banque avec gradient et animations.
 */

"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { TECHNICAL_PARAMS } from "@/lib/constants";

interface EnergyInflationChartProps {
    currentCost: number;
    /** Nombre d'années à projeter */
    yearsToProject?: number;
}

interface ChartDataPoint {
    year: string;
    cost: number;
    isToday: boolean;
}

export function EnergyInflationChart({
    currentCost,
    yearsToProject = 5,
}: EnergyInflationChartProps) {
    const inflationRate = TECHNICAL_PARAMS.constructionInflationRate;

    // Générer les données pour le graphique
    const data: ChartDataPoint[] = [];
    for (let i = 0; i <= yearsToProject; i++) {
        const year = new Date().getFullYear() + i;
        const projectedCost = currentCost * Math.pow(1 + inflationRate, i);
        data.push({
            year: i === 0 ? "Aujourd'hui" : `${year}`,
            cost: Math.round(projectedCost),
            isToday: i === 0,
        });
    }

    const maxCost = data[data.length - 1]!.cost;
    const costIncrease = maxCost - currentCost;
    const increasePercent = ((maxCost / currentCost - 1) * 100).toFixed(0);

    // Format pour les montants
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("fr-FR", {
            notation: "compact",
            maximumFractionDigits: 0,
        }).format(value) + " €";

    return (
        <div className="card-bento h-full flex flex-col group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-main flex items-center gap-3">
                    <span className="text-2xl">📈</span> Projection Coûts Travaux
                </h3>
                <div className="text-right">
                    <p className="label-technical">Inflation BTP</p>
                    <p className="text-sm font-medium text-warning tabular-nums">
                        +{(inflationRate * 100).toFixed(1)}%/an
                    </p>
                </div>
            </div>

            {/* Chart - Flex Growth */}
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4B679" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#D4B679" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="year"
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                            tickFormatter={formatCurrency}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                        />
                        <Tooltip
                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Coût estimé"]}
                            contentStyle={{
                                backgroundColor: "#161719", /* surface */
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                color: "#fff",
                                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)"
                            }}
                            itemStyle={{ color: "#D4B679" }}
                            labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
                            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                        />
                        <ReferenceLine
                            y={currentCost}
                            stroke="#4B5563" /* subtle */
                            strokeDasharray="3 3"
                            label={{
                                value: "Aujourd'hui",
                                fill: "#9CA3AF",
                                fontSize: 10,
                                position: "insideTopRight",
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="cost"
                            stroke="#D4B679" /* Primary */
                            strokeWidth={2}
                            fill="url(#costGradient)"
                            animationDuration={1500}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <p className="text-xs text-muted mt-6 text-center">
                Projection basée sur l&apos;indice BT01 — inflation construction {(inflationRate * 100).toFixed(1)}%/an
            </p>
        </div>
    );
}
