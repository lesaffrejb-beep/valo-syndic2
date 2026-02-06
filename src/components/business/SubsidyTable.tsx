"use client";

import { motion } from "framer-motion";
import {
    calculateSubsidies,
    type SimulationInputs,
    type IncomeProfile,
} from "@/lib/subsidy-calculator";
import { formatCurrency } from "@/lib/calculator";
import { DEFAULT_TRANSITION } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

// =============================================================================
// CONFIGURATION DES PROFILS
// =============================================================================

const PROFILE_CONFIG: Record<
    IncomeProfile,
    {
        label: string;
        color: string;
        borderColor: string;
        bgGradient: string;
    }
> = {
    Blue: {
        label: "Très Modeste",
        color: "#60A5FA",
        borderColor: "rgba(96, 165, 250, 0.3)",
        bgGradient: "from-blue-500/10 to-blue-500/5",
    },
    Yellow: {
        label: "Modeste",
        color: "#D97706", // Amber-600
        borderColor: "rgba(217, 119, 6, 0.3)",
        bgGradient: "from-amber-600/10 to-amber-600/5",
    },
    Purple: {
        label: "Intermédiaire",
        color: "#A78BFA",
        borderColor: "rgba(167, 139, 250, 0.3)",
        bgGradient: "from-purple-500/10 to-purple-500/5",
    },
    Pink: {
        label: "Aisé",
        color: "#E0B976", // Premium Gold
        borderColor: "rgba(229, 192, 123, 0.3)",
        bgGradient: "from-gold/10 to-gold/5",
    },
};

interface SubsidyTableProps {
    inputs: SimulationInputs;
}

export function SubsidyTable({ inputs }: SubsidyTableProps) {
    // thresholds/legend intentionally hidden for clarity
    const result = calculateSubsidies(inputs);
    const { profiles } = result;
    const profileOrder: IncomeProfile[] = ["Blue", "Yellow", "Purple", "Pink"];

    return (
        <Card variant="glass" className="overflow-visible border-white/5 bg-white/[0.02] group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                        🎯 Tableau Décisionnel 2026
                    </CardTitle>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Comparaison par profil fiscal</p>
                </div>
                {/* thresholds/legend toggle removed — always hide 'seuils' for users */}
            </CardHeader>

            <CardContent className="space-y-4">
                {/* HEADERS (Hidden on mobile, visible on desktop) */}
                <div className="hidden md:flex items-center px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-gray-400/70">
                    <div className="w-1/4">Profil</div>
                    <div className="w-1/6 text-right">Travaux</div>
                    <div className="w-1/6 text-right">Aides</div>
                    <div className="w-1/6 text-right text-emerald-400">Boost</div>
                    <div className="w-1/6 text-right text-gold">Reste à charge</div>
                    <div className="w-1/6 text-right">Mensualité</div>
                </div>

                {/* HORIZONTAL CARDS */}
                <div className="space-y-3">
                    {profileOrder.map((profile, index) => {
                        const data = profiles[profile];
                        const config = PROFILE_CONFIG[profile];
                        return (
                            <motion.div
                                key={profile}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-white/5 transition-all duration-300 group",
                                    "hover:bg-white/[0.04] hover:border-white/10",
                                    `profile-${profile}-border`,
                                    `profile-${profile}-bg`
                                )}
                            >
                                {/* Profil Badge & Mobile Label */}
                                <div className="flex items-center justify-between md:justify-start md:w-1/4 mb-3 md:mb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-8 rounded-full profile-${profile}-dot`} />
                                        <div>
                                            <p className="font-bold text-sm text-white">{config.label}</p>
                                        </div>
                                    </div>
                                    {/* Mobile Only: Reste à charge value shown prominently */}
                                    <div className="md:hidden">
                                        <p className="text-lg font-bold text-gold tabular-nums">{formatCurrency(data.remainingCost)}</p>
                                    </div>
                                </div>

                                {/* DESKTOP: COLUMNS */}
                                {/* Coût Travaux */}
                                <div className="hidden md:block w-1/6 text-right">
                                    <p className="text-sm font-medium text-gray-300 tabular-nums">{formatCurrency(data.workShareBeforeAid)}</p>
                                </div>

                                {/* Aides */}
                                <div className="md:w-1/6 flex justify-between md:block text-right mb-1 md:mb-0 border-b md:border-none border-white/5 pb-1 md:pb-0">
                                    <span className="md:hidden text-xs text-muted uppercase">Aides Publiques</span>
                                    <p className="text-sm font-medium text-white tabular-nums">-{formatCurrency(data.totalPublicSubsidies)}</p>
                                </div>

                                {/* Boost */}
                                <div className="md:w-1/6 flex justify-between md:block text-right mb-1 md:mb-0 border-b md:border-none border-white/5 pb-1 md:pb-0">
                                    <span className="md:hidden text-xs text-muted uppercase">Boost</span>
                                    {data.privateLocalBoost > 0 ? (
                                        <p className="text-sm font-bold text-emerald-400 tabular-nums">-{formatCurrency(data.privateLocalBoost)}</p>
                                    ) : (
                                        <span className="text-xs text-gray-500 hidden md:inline">—</span>
                                    )}
                                </div>

                                {/* Raste à charge (Desktop) */}
                                <div className="hidden md:block w-1/6 text-right">
                                    <p className="text-lg font-bold text-gold tabular-nums">{formatCurrency(data.remainingCost)}</p>
                                </div>

                                {/* Mensualité */}
                                <div className="md:w-1/6 flex justify-between md:block text-right pt-1 md:pt-0">
                                    <span className="md:hidden text-xs text-muted uppercase">Mensualité (20 ans)</span>
                                    <div>
                                        <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(data.monthlyPayment)}</p>
                                        <p className="text-[10px] text-gray-400 hidden md:block">/ mois</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Notes */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row gap-4 text-[10px] text-muted">
                    <p className="flex-1 leading-relaxed">
                        <strong className="text-white">Note :</strong> Le taux MPR affiché est le socle collectif. Les primes individuelles (jusqu&apos;à 3000€) sont versées en complément aux ménages modestes.
                    </p>
                    <div className="flex gap-4 opacity-70">
                        <span className="flex items-center gap-1">ℹ️ Éco-PTZ 0%</span>
                        <span className="flex items-center gap-1">📍 Hors IdF</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
