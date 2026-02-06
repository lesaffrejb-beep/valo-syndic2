"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/calculator";
import { type FinancingPlan } from "@/lib/schemas";

interface TransparentReceiptProps {
    financing: FinancingPlan;
}

export function TransparentReceipt({ financing }: TransparentReceiptProps) {
    // 1. Dépense INITIALE
    const costItems = [
        { label: "Travaux & Honoraires TTC", value: financing.totalCostTTC, type: "cost", highlight: false },
    ];

    // 2. Les AIDES (Déductions)
    const grantItems = [
        { label: "MaPrimeRénov' Copro", value: financing.mprAmount, type: "deduction", highlight: true },
        { label: "Prime CEE (Énergie)", value: financing.ceeAmount, type: "deduction", highlight: false },
        { label: "Aide AMO", value: financing.amoAmount, type: "deduction", highlight: false },
        { label: "Aides Locales", value: financing.localAidAmount, type: "deduction", highlight: false },
    ].filter(item => item.value > 0);

    // 3. Le FINANCEMENT (Éco-PTZ)
    const loanItems = [
        { label: "Éco-PTZ (0% d'intérêts)", value: financing.ecoPtzAmount, type: "loan", highlight: false },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col justify-between p-6 relative"
        >
            {/* HEADER - Ticket de Caisse */}
            <div className="text-center mb-6">
                <div className="inline-block border border-white/10 rounded-full px-3 py-1 mb-3 bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-widest">RÉCAPITULATIF FINANCIER</span>
                </div>
            </div>

            {/* BODY - La Cascade */}
            <div className="flex-1 space-y-2 font-mono text-sm relative">

                {/* Vertical Guide Line */}
                <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent ml-[1px]" />

                {/* 1. COÛT */}
                {costItems.map((item, i) => (
                    <div key={`cost-${i}`} className="flex justify-between items-baseline py-1 group pl-4">
                        <span className="text-zinc-400 font-medium tracking-tight">{item.label}</span>
                        <span className="text-white font-bold financial-nums tracking-normal">{formatCurrency(item.value)}</span>
                    </div>
                ))}

                {/* Separator */}
                <div className="border-b border-dashed border-white/10 my-2 opacity-50" />

                {/* 2. DEDUCTIONS (AIDES) */}
                {grantItems.map((item, i) => (
                    <div key={`grant-${i}`} className="flex justify-between items-baseline py-1.5 group pl-4 relative">
                        <span className="absolute left-[-3px] top-1/2 -translate-y-1/2 text-[10px] text-emerald-500/80 font-bold opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                        <span className={item.highlight ? "text-emerald-400 font-bold" : "text-zinc-500 group-hover:text-emerald-400/80 transition-colors"}>
                            {item.label}
                        </span>
                        <span className="text-emerald-500 financial-nums">- {formatCurrency(item.value)}</span>
                    </div>
                ))}

                {/* Separator Reste à Charge - Double Line */}
                <div className="border-b border-white/10 mt-3 mb-1" />
                <div className="border-b border-white/10 mb-3" />

                <div className="flex justify-between items-baseline py-1 pl-4">
                    <span className="text-white/90 font-bold uppercase text-[10px] tracking-widest">Reste à Financer</span>
                    <span className="text-white font-bold text-lg financial-nums">{formatCurrency(financing.remainingCost)}</span>
                </div>

                {/* 3. LOAN */}
                {financing.remainingCost > 0 && (
                    <div className="pl-4 pt-4">
                        {loanItems.map((item, i) => (
                            <div key={`loan-${i}`} className="flex justify-between items-baseline py-1 text-primary/80 text-xs">
                                <span className="flex items-center gap-2 italic">
                                    <span>↳</span>
                                    <span>{item.label}</span>
                                </span>
                                <span>{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FOOTER - THE MONEY SHOT (Effort Mensuel) */}
            <div className="mt-8 pt-6 border-t border-dashed border-white/20">
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-5 border border-gold/20 flex justify-between items-center group shadow-[0_0_30px_rgba(217,119,6,0.1)]">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-gold font-bold mb-1">Effort d&apos;épargne</span>
                        <span className="text-xs text-gold/70">Mensualité réelle</span>
                    </div>

                    <div className="text-right">
                        <span className="text-3xl font-black text-white tracking-tighter financial-nums">
                            {financing.monthlyPayment}€
                        </span>
                        <span className="text-sm text-gold/70 font-medium ml-1">/mois</span>
                    </div>
                </div>

                {financing.monthlyPayment < 50 && (
                    <div className="text-center mt-3">
                        <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest">
                            Moins cher qu&apos;un abonnement internet
                        </span>
                    </div>
                )}
            </div>

            {/* Background Noise Texture Overlay if possible/needed, simpler to keep clean for now */}
        </motion.div>
    );
}
