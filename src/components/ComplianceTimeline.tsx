import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DPE_PROHIBITION_DATES, DPE_STATUS_LABELS, type DPELetter } from "@/lib/constants";
import { formatDate } from "@/lib/calculator";

interface ComplianceTimelineProps {
    currentDPE: DPELetter;
    className?: string;
}

export function ComplianceTimeline({ currentDPE, className = "" }: ComplianceTimelineProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const today = new Date();

    const entries: Array<{
        dpe: DPELetter;
        date: Date;
        isPast: boolean;
        isCurrent: boolean;
    }> = [];

    // Construire les entrées de la timeline - Chronologique (G -> F -> E)
    (["G", "F", "E"] as const).forEach((dpe) => {
        const date = DPE_PROHIBITION_DATES[dpe];
        if (date) {
            entries.push({
                dpe,
                date,
                isPast: date < today,
                isCurrent: dpe === currentDPE,
            });
        }
    });

    return (
        <motion.div
            ref={ref}
            className={`relative w-full ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header Section */}
            <div className="mb-8 flex items-center justify-between">
                <h3 className="text-xl font-bold text-main flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-white/5 text-lg shadow-sm">
                        ⏳
                    </span>
                    <span className="tracking-tight">Calendrier Loi Climat</span>
                </h3>
            </div>

            {/* Connector Line (Vertical) */}
            <div className="absolute left-[1.15rem] top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent z-0" />

            <div className="flex flex-col gap-6 relative z-10">
                {entries.map(({ dpe, date, isPast, isCurrent }, index) => {
                    const isCurrentDPE = dpe === currentDPE;

                    // Status Colors
                    const activeColor = isCurrentDPE ? "text-amber-400" : isPast ? "text-danger" : "text-muted";
                    const activeBorder = isCurrentDPE ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_-5px_rgba(245,158,11,0.1)]" : isPast ? "border-danger/10 bg-danger/5" : "border-white/5 bg-surface/40";
                    const dotColor = isCurrentDPE ? "bg-amber-500 border-amber-950" : isPast ? "bg-danger/20 border-danger/50" : "bg-surface border-white/10";

                    return (
                        <motion.div
                            key={dpe}
                            className="group relative pl-12"
                            initial={{ opacity: 0, x: -10 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{
                                duration: 0.5,
                                delay: 0.1 + index * 0.1,
                                ease: "easeOut"
                            }}
                        >
                            {/* Timeline Dot */}
                            <div className={`absolute left-2.5 top-8 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 z-20 transition-all duration-500 ${dotColor} ${isCurrentDPE ? 'scale-125' : ''}`}>
                                {isCurrentDPE && <div className="absolute inset-0 rounded-full animate-ping bg-amber-500/30" />}
                            </div>

                            {/* Content Card */}
                            <div className={`
                                    relative p-4 rounded-xl border backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-4
                                    ${activeBorder} hover:border-white/10 hover:bg-surface/60
                                `}>
                                <div className="flex items-center gap-4">
                                    {/* Date Badge */}
                                    <div className={`
                                            inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest border
                                            ${isCurrentDPE ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : isPast ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-white/5 border-white/5 text-muted'}
                                         `}>
                                        <span>{formatDate(date)}</span>
                                    </div>

                                    {/* DPE Letter */}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl font-black tracking-tighter ${activeColor}`}>
                                            {dpe}
                                        </span>
                                        {isCurrentDPE && (
                                            <span className="text-[9px] font-bold text-black bg-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                Actuel
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Text (Right Side) */}
                                <div className="text-right">
                                    {isPast ? (
                                        <div className="flex items-center gap-1.5 justify-end text-danger/80 text-[10px] font-medium uppercase tracking-wide">
                                            Interdit
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-muted uppercase tracking-wide">Dans</span>
                                            <span className={`text-base font-mono font-bold ${activeColor}`}>
                                                {Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))}
                                                <span className="text-[9px] ml-1 font-sans font-normal text-muted/60">MOIS</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div >
        </motion.div >
    );
}

// Ensure default exports don't conflict (standard pattern)

// 2025, 2028, 2034 are the default keys in constants, rendering in that order because of the array literal.
