"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/calculator";
import { type FinancingPlan } from "@/lib/schemas";

interface ReceiptLedgerProps {
    financing: FinancingPlan;
    className?: string;
}

/**
 * RECEIPT LEDGER — "Le Ticket de Caisse Comptable"
 * Design: Document professionnel irréfutable avec timestamps et sources
 *
 * Philosophie: Ce n'est plus un simple "panier", c'est un document comptable
 * qui inspire confiance. Chaque ligne est traçable, sourcée, horodatée.
 */
export function ReceiptLedger({ financing, className = "" }: ReceiptLedgerProps) {
    // Current timestamp for freshness
    const now = new Date();
    const timestamp = now.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Line items with sources
    const lineItems = [
        {
            category: "DÉPENSES",
            items: [
                {
                    label: "Travaux & Honoraires TTC",
                    amount: financing.totalCostTTC,
                    type: "debit" as const,
                    source: "Devis Entreprise",
                    verified: true
                }
            ]
        },
        {
            category: "SUBVENTIONS",
            items: [
                {
                    label: "MaPrimeRénov' Copropriété",
                    amount: financing.mprAmount,
                    type: "credit" as const,
                    source: "Anah 2026",
                    verified: true
                },
                {
                    label: "Certificats Économie Énergie",
                    amount: financing.ceeAmount,
                    type: "credit" as const,
                    source: "Barème CEE",
                    verified: true
                },
                {
                    label: "Aide AMO (Assistance MO)",
                    amount: financing.amoAmount,
                    type: "credit" as const,
                    source: "Anah Forfait",
                    verified: true
                },
                {
                    label: "Aides Locales",
                    amount: financing.localAidAmount,
                    type: "credit" as const,
                    source: "Collectivité",
                    verified: false
                }
            ].filter(item => item.amount > 0)
        },
        {
            category: "FINANCEMENT",
            items: [
                {
                    label: "Éco-PTZ Collectif (0% intérêts)",
                    amount: financing.ecoPtzAmount,
                    type: "neutral" as const,
                    source: "Banque Partenaire",
                    verified: true
                }
            ]
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative bg-charcoal bg-glass-gradient rounded-3xl border border-white/10
                shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.1)]
                backdrop-blur-xl overflow-hidden ${className}`}
        >
            {/* TEXTURE */}
            <div className="absolute inset-0 bg-noise opacity-[0.015] pointer-events-none" />

            {/* HEADER - Professional Document Style */}
            <div className="p-6 pb-5 border-b border-white/10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white/60" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Plan de Financement</h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                                Résumé des Coûts et Aides
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEDGER BODY */}
            <div className="p-6 font-mono text-xs space-y-6">
                {lineItems.map((section, sectionIdx) => (
                    <motion.div
                        key={section.category}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIdx * 0.1 }}
                    >
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-[1px] w-8 bg-white/10" />
                            <h4 className="text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold">
                                {section.category}
                            </h4>
                            <div className="h-[1px] flex-1 bg-white/10" />
                        </div>

                        {/* Line Items */}
                        <div className="space-y-2">
                            {section.items.map((item, itemIdx) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: sectionIdx * 0.1 + itemIdx * 0.05 }}
                                    className="group"
                                >
                                    <div className="flex items-start justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`
                                                    ${item.type === 'debit' ? 'text-white' : ''}
                                                    ${item.type === 'credit' ? 'text-emerald-400' : ''}
                                                    ${item.type === 'neutral' ? 'text-blue-400' : ''}
                                                    font-semibold
                                                `}>
                                                    {item.label}
                                                </span>
                                                {item.verified && (
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500/60" />
                                                )}
                                                {!item.verified && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px]">
                                                        À valider
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`
                                            text-right tabular-nums font-bold
                                            ${item.type === 'debit' ? 'text-white' : ''}
                                            ${item.type === 'credit' ? 'text-emerald-400' : ''}
                                            ${item.type === 'neutral' ? 'text-blue-400' : ''}
                                        `}>
                                            {item.type === 'credit' && '- '}
                                            {formatCurrency(item.amount)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* CALCULATION SUMMARY */}
                <div className="pt-4 border-t-2 border-dashed border-white/10 space-y-2">
                    <div className="flex justify-between items-center px-3 py-2">
                        <span className="text-white/60 uppercase tracking-wider text-[10px] font-bold">
                            Reste à Financer
                        </span>
                        <span className="text-lg font-black text-white tabular-nums">
                            {formatCurrency(financing.remainingCost)}
                        </span>
                    </div>

                    {financing.ecoPtzAmount > 0 && (
                        <div className="px-3 py-2 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-blue-400">↳</span>
                                    <span className="text-blue-400 text-xs">Financé par Éco-PTZ</span>
                                </div>
                                <span className="text-blue-400 font-bold tabular-nums">
                                    {formatCurrency(financing.ecoPtzAmount)}
                                </span>
                            </div>
                            <div className="mt-1 text-[9px] text-white/30 text-right">
                                Prêt à 0% d&apos;intérêts sur 20 ans
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER - THE VERDICT */}
            <div className="border-t-2 border-white/10 bg-gradient-to-b from-transparent to-white/[0.02] p-6">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold mb-1">
                                Effort Mensuel Final
                            </div>
                            <div className="text-[9px] text-white/30 font-mono">
                                Après aides et financement
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-gold tracking-tighter tabular-nums"
                                    style={{
                                        textShadow: "0 0 24px rgba(212, 175, 55, 0.3)"
                                    }}>
                                    {Math.round(financing.monthlyPayment)}
                                </span>
                                <span className="text-xl font-bold text-gold/80">€</span>
                            </div>
                            <div className="text-xs text-white/40 mt-0.5">/mois pendant 20 ans</div>
                        </div>
                    </div>
                </div>

            </div>

        </motion.div>
    );
}
