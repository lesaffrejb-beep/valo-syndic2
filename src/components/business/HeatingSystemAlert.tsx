"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Zap, ArrowUpRight } from "lucide-react";

interface HeatingSystemAlertProps {
    heatingType: string | null | undefined;
}

export function HeatingSystemAlert({ heatingType }: HeatingSystemAlertProps) {
    if (!heatingType) return null;

    const isFossilFuel =
        heatingType.toLowerCase().includes('gaz') ||
        heatingType.toLowerCase().includes('fioul');

    if (!isFossilFuel) return null;

    const fuelLabel = heatingType.includes('Gaz') || heatingType.includes('gaz') ? 'Gaz' : 'Fioul';

    return (
        <Card variant="premium" className="relative overflow-hidden border-primary/30 group bg-surface/80 hover:border-white/10 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            {/* Animated Gradient Border */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <div className="p-6 flex flex-col sm:flex-row items-center gap-6 relative z-10">
                {/* Icon */}
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                        Coup de pouce
                    </div>
                </div>

                {/* Text */}
                <div className="flex-grow text-center sm:text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                        Opportunité de Financement
                    </p>
                    <h3 className="text-lg font-bold text-white mb-1">
                        Chauffage {fuelLabel} détecté
                    </h3>
                    <p className="text-sm text-muted">
                        Votre copropriété est éligible au dispositif <span className="text-white font-medium">Coup de Pouce Chauffage</span>.
                    </p>
                </div>

                {/* CTA / Value */}
                <div className="shrink-0 text-center sm:text-right">
                    <div className="inline-flex flex-col items-center sm:items-end p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <span className="text-[10px] text-primary/80 uppercase font-bold tracking-wider mb-0.5">Bonus Estimé</span>
                        <span className="text-3xl font-black text-white tracking-tighter flex items-center gap-1">
                            +5 000 € <ArrowUpRight className="w-4 h-4 text-primary" />
                        </span>
                        <span className="text-[10px] text-primary/60 font-medium">Versement immédiat</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
