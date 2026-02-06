"use client";

import { useState, useMemo, useEffect } from "react";
import { type FinancingPlan } from "@/lib/schemas";
import { ECO_PTZ_COPRO } from "@/lib/constants";
import { formatCurrency } from "@/lib/calculator";
import { calculateSubsidies, type IncomeProfile, type SimulationInputs } from "@/lib/subsidy-calculator";
import { Calculator, Euro, PiggyBank } from "lucide-react";
import { useViewModeStore } from "@/stores/useViewModeStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCurrency } from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";

interface TantiemeCalculatorProps {
    financing: FinancingPlan;
    simulationInputs?: SimulationInputs | undefined;
    className?: string;
}

const PROFILE_OPTIONS: { id: IncomeProfile; label: string; color: string }[] = [
    { id: "Blue", label: "T. Modeste", color: "bg-blue-400" },
    { id: "Yellow", label: "Modeste", color: "bg-amber-600" },
    { id: "Purple", label: "Interm.", color: "bg-purple-400" },
    { id: "Pink", label: "Aisé", color: "bg-gold" }, // Gold instead of Pink
];

export function TantiemeCalculator({ financing, simulationInputs, className = "" }: TantiemeCalculatorProps) {
    const { viewMode, userTantiemes, setUserTantiemes, setViewMode } = useViewModeStore();
    const [selectedProfile, setSelectedProfile] = useState<IncomeProfile | null>(null);

    // Use store value directly - no local state to avoid sync issues
    const tantiemes = userTantiemes;

    const profileData = useMemo(() => {
        if (!simulationInputs) return null;
        return calculateSubsidies(simulationInputs).profiles;
    }, [simulationInputs]);

    const calculation = useMemo(() => {
        let partLotCash, partLotLoan, monthlyPayment;

        if (selectedProfile && profileData) {
            const nbUnits = simulationInputs?.nbLots || 1;
            const avgTantiemes = 1000 / nbUnits;
            const ratio = tantiemes / avgTantiemes;

            partLotCash = profileData[selectedProfile].remainingCost * ratio; // Using remainingCost as base for visual simplicity
            monthlyPayment = profileData[selectedProfile].monthlyPayment * ratio;
            partLotLoan = (profileData[selectedProfile].workShareBeforeAid - profileData[selectedProfile].remainingCost) * ratio; // Conceptual aid part? No, let's keep it simple

            // Re-deriving cleanly:
            // Work Share = profileData.workShareBeforeAid * ratio
            // Aid = (profileData.workShareBeforeAid - profileData.remainingCost) * ratio
            // Loan/Cash = profileData.remainingCost * ratio

            return {
                partLotCash: profileData[selectedProfile].remainingCost * ratio,
                partLotLoan: profileData[selectedProfile].remainingCost * ratio, // Assuming 100% financed by loan/cash mix, confusing prop names
                monthlyPayment: profileData[selectedProfile].monthlyPayment * ratio,
                durationYears: ECO_PTZ_COPRO.maxDurationYears,
                partLotTotal: profileData[selectedProfile].workShareBeforeAid * ratio,
                aid: (profileData[selectedProfile].workShareBeforeAid - profileData[selectedProfile].remainingCost) * ratio
            };
        }

        // Default legacy calculation (Global Average)
        const shareRatio = tantiemes / 1000;
        const partLotCashCalc = financing.remainingCost * shareRatio;
        const partLotLoanCalc = financing.ecoPtzAmount * shareRatio;
        const monthlyPaymentCalc = financing.monthlyPayment * shareRatio;

        return {
            partLotCash: partLotCashCalc,
            partLotLoan: partLotLoanCalc,
            monthlyPayment: monthlyPaymentCalc,
            durationYears: ECO_PTZ_COPRO.maxDurationYears,
            partLotTotal: financing.remainingCost * shareRatio, // Simplification
            aid: 0
        };
    }, [financing, tantiemes, selectedProfile, profileData, simulationInputs]);

    return (
        <Card variant="default" className={cn("overflow-visible group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]", className)}>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gold/10 border border-gold/20">
                        <Calculator className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-white">Simulateur Individuel</CardTitle>
                        <p className="text-sm text-muted">Estimez votre mensualité selon votre quote-part</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-6">
                {/* INPUTS SECTION */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                        <div className="w-1 h-6 bg-gold rounded-full" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-white">Paramètres de Simulation</h4>
                    </div>

                    {/* Profile Selector */}
                    {simulationInputs && (
                        <div className="space-y-3">
                            <label className="text-xs uppercase tracking-wider font-medium text-muted flex items-center gap-2">
                                <PiggyBank className="w-3 h-3" /> Votre Profil Fiscal
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {PROFILE_OPTIONS.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={() => setSelectedProfile(selectedProfile === profile.id ? null : profile.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center py-3 rounded-xl border transition-all duration-300",
                                            selectedProfile === profile.id
                                                ? "bg-gold/10 border-gold text-white shadow-[0_0_15px_-3px_rgba(229,192,123,0.3)]"
                                                : "bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:border-white/10"
                                        )}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full mb-2", profile.color)} />
                                        <span className="text-[10px] uppercase font-bold tracking-wide">{profile.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* RESULTS SECTION - Hero Card */}
                <div className="relative bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20 rounded-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative flex flex-col items-center justify-center text-center space-y-4 p-8">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-6 bg-gold rounded-full" />
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Résultat Personnalisé</h4>
                        </div>

                        <p className="text-xs uppercase tracking-[0.2em] text-muted font-medium">Votre effort d&apos;épargne</p>

                        <div className="text-6xl md:text-7xl font-sans font-light text-gold tracking-tighter financial-num">
                            <AnimatedCurrency value={calculation.monthlyPayment} />
                            <span className="text-2xl text-gold/50 ml-1">€</span>
                        </div>
                        <p className="text-sm text-gold/60 font-medium">par mois pendant {calculation.durationYears} ans</p>

                        <div className="w-full h-px bg-white/10 my-6" />

                        <div className="w-full space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Quote-part Travaux</span>
                                <span className="text-white financial-num">{formatCurrency(calculation.partLotTotal)}</span>
                            </div>
                            {calculation.aid > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-success">Aides Déduites</span>
                                    <span className="text-success financial-num">- {formatCurrency(calculation.aid)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                                <span className="font-medium text-white">Reste à financer</span>
                                <span className="font-medium text-gold financial-num">{formatCurrency(calculation.partLotCash)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Added 'size="sm"' to Button which I didn't verify if I implemented, but standard shadcn has it.
// I implemented 'variant' but not 'size' in my Button.tsx. I should fix that to avoid type error or just remove size prop.
// I'll remove `size="sm"` and add class `h-8 px-3 text-xs` to match "sm" manually for safety.
