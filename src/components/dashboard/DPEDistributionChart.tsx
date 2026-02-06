"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface DPEDistributionChartProps {
    userDPE?: string;
    neighborhoodData?: { letter: string; percentage: number }[];
}

/**
 * DPEDistributionChart Component
 * Affiche la distribution des DPE dans le quartier avec mise en évidence du DPE de l'utilisateur.
 * Style Glassmorphism / Bento.
 */
export function DPEDistributionChart({
    userDPE = 'F',
    neighborhoodData
}: DPEDistributionChartProps) {

    // Données simulées si aucune donnée fournie
    const defaultData = [
        { letter: 'A', percentage: 2 },
        { letter: 'B', percentage: 5 },
        { letter: 'C', percentage: 15 },
        { letter: 'D', percentage: 25 },
        { letter: 'E', percentage: 38 },
        { letter: 'F', percentage: 10 },
        { letter: 'G', percentage: 5 },
    ];

    const data = neighborhoodData || defaultData;

    // Couleurs sémantiques basées sur le DPE
    const getDPEColor = (letter: string) => {
        switch (letter.toUpperCase()) {
            case 'A': return '#10B981'; // success
            case 'B': return '#34D399';
            case 'C': return '#F59E0B'; // warning
            case 'D': return '#FBBF24';
            case 'E': return '#F59E0B';
            case 'F': return '#EF4444'; // danger
            case 'G': return '#B91C1C';
            default: return '#9CA3AF'; // muted
        }
    };

    // Calcul du pourcentage d'immeubles mieux classés (simulé/approximatif)
    const betterThanCount = data
        .filter(item => item.letter < userDPE)
        .reduce((acc, curr) => acc + curr.percentage, 0);

    return (
        <div className="card-bento flex flex-col gap-6 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold text-main">
                    Benchmark de Quartier
                </h3>
                <p className="text-sm text-muted">
                    Distribution des classes energetiques dans un rayon de 500m.
                </p>
            </div>

            <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest font-semibold text-danger/80">
                        Urgence Psychologique
                    </span>
                    <span className="text-lg font-medium text-main">
                        {betterThanCount}% des immeubles sont mieux classés.
                    </span>
                </div>
                <div className="h-12 w-12 rounded-full bg-danger/20 flex items-center justify-center border border-danger/30">
                    <span className="text-xl font-bold text-danger">{userDPE}</span>
                </div>
            </div>

            <div className="h-[240px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="letter"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4B5563', fontSize: 10 }}
                            unit="%"
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{
                                backgroundColor: '#161719',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#FFFFFF', fontSize: '12px' }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Bar
                            dataKey="percentage"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.letter === userDPE ? getDPEColor(entry.letter) : 'rgba(255,255,255,0.1)'}
                                    stroke={entry.letter === userDPE ? 'rgba(255,255,255,0.2)' : 'none'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 mt-2">
                <div className="h-2 w-2 rounded-full bg-danger" />
                <span className="text-xs text-muted">Votre immeuble est parmi les moins performants du secteur.</span>
            </div>
        </div>
    );
}
