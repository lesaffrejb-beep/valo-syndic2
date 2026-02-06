/**
 * VALO-SYNDIC — Dashboard "Obsidian Cockpit"
 * ==========================================
 * Design System: Stealth Wealth / Matte Luxury
 * Architecture: Bento Grid + Sticky Control Center
 */

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import type { SavedSimulation } from '@/lib/schemas';
import { MprSuspensionAlert } from '@/components/business/MprSuspensionAlert';
import { MarketLiquidityAlert } from '@/components/business/MarketLiquidityAlert';
import { ComplianceTimeline } from '@/components/ComplianceTimeline';
import { TransparentReceipt } from '@/components/business/TransparentReceipt';
import { ValuationCard } from '@/components/business/ValuationCard';
import { InactionCostCard } from '@/components/business/InactionCostCard';
import { TantiemeCalculator } from '@/components/business/TantiemeCalculator';
import { RisksCard } from '@/components/business/RisksCard';
import { isMprCoproSuspended, getLocalPassoiresShare } from '@/lib/market-data';
import type { DPELetter } from '@/lib/constants';

// --- MOCK DATA FOR UI DEVELOPMENT ---
const MOCK_FINANCING = {
    totalCostHT: 450000,
    mprAmount: 120000,
    amoAmount: 3000,
    ceeAmount: 8000,
    localAidAmount: 5000,
    ecoPtzAmount: 180000,
    subsidies: 120000,
    loans: 300000,
    monthlyPayment: 250,
    remainingCost: 30000,
    netRemaining: 30000
};

const MOCK_VALUATION = {
    currentValue: 350000,
    projectedValue: 410000,
    greenValueGain: 60000,
    greenValueGainPercent: 0.15,
    netROI: 30000,
    salesCount: 12,
    priceSource: "Etalab DVF"
};

const MOCK_INACTION = {
    currentCost: 30000,
    projectedCost3Years: 38000,
    valueDepreciation: 15000,
    totalInactionCost: 23000,
    inflationCost: 8000,
    energyLoss: 4000,
    depreciationLoss: 15000
};

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<SavedSimulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<SavedSimulation | null>(null);

    // --- LOGIC ---
    useEffect(() => {
        if (!authLoading && !user) router.push('/');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchProjects = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('simulations')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (fetchError) throw fetchError;
                setProjects(data || []);
                if (data && data.length > 0) {
                    setSelectedProject(data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch projects:', err);
                setError(err instanceof Error ? err.message : 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-app flex items-center justify-center">
                <div className="text-primary/50 animate-pulse font-mono tracking-[0.2em] text-xs uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    Initialisation du Cockpit...
                </div>
            </div>
        );
    }

    if (!user) return null;

    if (!selectedProject && projects.length === 0) {
        return (
            <div className="min-h-screen bg-app flex items-center justify-center p-4 bg-noise">
                <div className="text-center space-y-6">
                    <h1 className="text-2xl text-main font-sans font-light tracking-tight">Aucun projet actif</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-primary"
                    >
                        Initialiser une simulation
                    </button>
                </div>
            </div>
        )
    }

    // --- RENDER : OBSIDIAN COCKPIT (BENTO GRID) ---
    return (
        <div className="min-h-screen bg-app text-main font-sans pb-40 bg-noise selection:bg-primary/30 selection:text-white">

            <div className="max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">

                {/* ZONE A: ALERTES (Contextual) */}
                <div className="space-y-3">
                    <MprSuspensionAlert isSuspended={isMprCoproSuspended()} />
                    <MarketLiquidityAlert shareOfSales={getLocalPassoiresShare()} />
                </div>

                {/* THE BENTO GRID (Zones B, C, D) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">

                    {/* ZONE B: CONTEXTE (Left - 25% - 3 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        {/* Risk Radar */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="card-obsidian aspect-square flex flex-col justify-between group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <h3 className="label-technical mb-1">Analyse Terrain</h3>
                                <p className="text-xs text-subtle">Risques Naturels & Technologiques</p>
                            </div>

                            <div className="flex-1 flex items-center justify-center py-4">
                                <div className="scale-75 origin-center opacity-80 group-hover:opacity-100 group-hover:scale-90 transition-all duration-300">
                                    <RisksCard />
                                </div>
                            </div>
                        </motion.div>

                        {/* Climate Timeline */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card-obsidian flex-1 flex flex-col justify-center min-h-[300px] relative overflow-hidden"
                        >
                            <div className="relative z-10 h-full">
                                <ComplianceTimeline
                                    currentDPE={((selectedProject?.json_data?.input as any)?.currentDPE as DPELetter) || ("F" as DPELetter)}
                                    className="h-full"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* ZONE C: PREUVE (Center - 50% - 6 cols) */}
                    <div className="lg:col-span-6 flex flex-col h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card-obsidian flex-1 relative overflow-hidden flex flex-col"
                            style={{
                                boxShadow: "0 0 100px -30px rgba(255,255,255,0.05)"
                            }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="p-2 h-full">
                                <TransparentReceipt
                                    financing={selectedProject?.json_data?.financing || MOCK_FINANCING}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* ZONE D: PROJECTION (Right - 25% - 3 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        {/* Valuation (Gain - Gold Glow) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card-obsidian flex-1 min-h-[400px] relative overflow-hidden group border-primary/20"
                            style={{
                                boxShadow: "0 0 40px -10px rgba(212, 182, 121, 0.1)"
                            }}
                        >
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[100px] group-hover:bg-primary/30 transition-colors" />
                            <ValuationCard
                                valuation={selectedProject?.json_data?.result?.valuation || MOCK_VALUATION}
                                financing={selectedProject?.json_data?.financing || MOCK_FINANCING}
                            />
                        </motion.div>

                        {/* Inaction Cost (Fear - Red Subtle Glow) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="card-obsidian h-auto min-h-[250px] relative overflow-hidden group hover:border-danger/20 transition-colors"
                        >
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-danger/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <InactionCostCard
                                inactionCost={selectedProject?.json_data?.result?.inaction || MOCK_INACTION}
                            />
                        </motion.div>
                    </div>

                </div>

            </div>

            {/* ZONE E: SPACESHIP CONTROL BAR (Sticky Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-6 perspective-[1000px]">
                <motion.div
                    initial={{ y: 100, opacity: 0, rotateX: 20 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    className="pointer-events-auto w-[95%] max-w-[1200px] bg-[#09090B]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.8)] rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center gap-6 justify-between group hover:bg-[#09090B]/90 transition-colors"
                >
                    {/* Glow Line Top */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                    {/* LEFT: Profile (Personas) */}
                    <div className="hidden md:flex items-center gap-4 min-w-[200px]">
                        <span className="label-technical">Persona</span>
                        <div className="flex -space-x-2">
                            {['#3B82F6', '#EAB308', '#8B5CF6'].map((color, i) => (
                                <button
                                    key={color}
                                    className="w-8 h-8 rounded-full border-2 border-[#09090B] hover:scale-110 hover:z-10 transition-all focus:ring-2 ring-white/20"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* CENTER: Calculator (The Engine) */}
                    <div className="flex-1 w-full max-w-2xl border-x border-white/5 px-6">
                        <TantiemeCalculator
                            financing={selectedProject?.json_data?.financing || MOCK_FINANCING}
                            simulationInputs={selectedProject?.json_data?.input}
                        />
                    </div>

                    {/* RIGHT: Export Actions */}
                    <div className="flex items-center gap-3 min-w-[200px] justify-end">
                        <button className="btn-ghost text-xs hover:bg-white/5 border border-transparent hover:border-white/10 text-muted">
                            <span className="mr-2">⚡</span>Objections
                        </button>
                        <div className="h-8 w-[1px] bg-white/10 mx-2" />
                        <button className="btn-secondary h-10 px-5 text-sm">
                            PDF
                        </button>
                        <button className="btn-primary h-10 px-6 text-sm bg-white text-black hover:bg-white/90 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
                            Export
                        </button>
                    </div>

                </motion.div>
            </div>

        </div>
    );
}
