"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useViewModeStore } from "@/stores/useViewModeStore";
import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";

interface ViewModeToggleProps {
    className?: string;
    totalUnits?: number;
    avgSurface?: number;
}

export function ViewModeToggle({ className, totalUnits = 20, avgSurface = 65 }: ViewModeToggleProps) {
    const { viewMode, setViewMode, userTantiemes, setUserTantiemes } = useViewModeStore();
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const percentage = (userTantiemes / 1000) * 100;
    const isFullBuilding = userTantiemes >= 995;

    // Calcul correct de la surface
    const totalSurface = totalUnits * avgSurface;
    const lotSurface = Math.round((userTantiemes / 1000) * totalSurface);

    // Déterminer le label actif basé sur la valeur
    const effectiveMode = isFullBuilding ? 'immeuble' : 'maPoche';

    const handleContainerClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const tantiemes = Math.round((pct / 100) * 1000);
        
        setUserTantiemes(Math.max(1, tantiemes));
        if (tantiemes >= 995) {
            setViewMode('immeuble');
        } else {
            setViewMode('maPoche');
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleContainerClick(e);
    };

    // global mouse listeners while dragging: defined inside effect to avoid stale deps
    useEffect(() => {
        if (!isDragging) return;

        const onMouseUp = () => {
            setIsDragging(false);
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
            const tantiemes = Math.round((pct / 100) * 1000);

            setUserTantiemes(Math.max(1, tantiemes));
            if (tantiemes >= 995) {
                setViewMode('immeuble');
            } else {
                setViewMode('maPoche');
            }
        };

        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);

        return () => {
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
        };
    }, [isDragging, setUserTantiemes, setViewMode]);

    // Sync viewMode with value
    useEffect(() => {
        if (isFullBuilding && viewMode !== 'immeuble') {
            setViewMode('immeuble');
        } else if (!isFullBuilding && viewMode === 'immeuble') {
            setViewMode('maPoche');
        }
    }, [userTantiemes, isFullBuilding, viewMode, setViewMode]);

    const setPreset = (value: number) => {
        setUserTantiemes(value);
        if (value >= 995) {
            setViewMode('immeuble');
        } else {
            setViewMode('maPoche');
        }
    };

    return (
        <div className={cn("relative w-full", className)}>
            {/* Container principal - La Barre */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                className={cn(
                    "relative h-14 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                    isDragging && "scale-[1.02] border-white/20"
                )}
            >
                {/* Barre de progression - La magie visuelle */}
                <motion.div
                    className={cn(
                        "absolute left-0 top-0 bottom-0 transition-colors duration-500",
                        isFullBuilding 
                            ? "bg-gradient-to-r from-white/90 to-white" 
                            : "bg-gradient-to-r from-gold/80 via-gold to-gold/90"
                    )}
                    initial={false}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                {/* Label MA POCHE - Toujours lisible */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                    <div className="px-2 py-1 rounded-lg flex items-center gap-2 bg-black/45 backdrop-blur-sm ring-1 ring-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                        <User className="w-4 h-4 text-white/90" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                            Ma Poche
                        </span>
                    </div>
                </div>

                {/* Label IMMEUBLE - Toujours lisible */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10 pointer-events-none">
                    <div className="px-2 py-1 rounded-lg flex items-center gap-2 bg-black/45 backdrop-blur-sm ring-1 ring-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                        <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                            Immeuble
                        </span>
                        <Building2 className="w-4 h-4 text-white/90" />
                    </div>
                </div>

                {/* Indicateur avec pourcentage - Suit la barre */}
                <motion.div
                    className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
                    initial={false}
                    animate={{ left: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{ x: '-50%' }}
                >
                    <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-lg transition-colors duration-200",
                        percentage < 50 
                            ? "bg-gold text-black" 
                            : percentage > 90 
                                ? "bg-black/40 text-white"
                                : "bg-black/30 text-white"
                    )}>
                        {Math.round(percentage)}%
                    </div>
                </motion.div>
            </div>

            {/* Labels sous la barre */}
            <div className="flex justify-between mt-2 px-1">
                <span className="text-[9px] uppercase tracking-widest text-white/30">
                    {userTantiemes} tantièmes
                </span>
                <span className="text-[9px] uppercase tracking-widest text-white/30">
                    {isFullBuilding 
                        ? `${totalUnits} lots · ${totalSurface} m²` 
                        : `~${lotSurface} m² · ${Math.round((userTantiemes/1000)*totalUnits)} lots env.`}
                </span>
            </div>

            {/* Presets rapides */}
            <div className="flex justify-center gap-2 mt-3">
                {[
                    { val: 50, label: 'Studio' },
                    { val: 100, label: 'T2' },
                    { val: 200, label: 'T3' },
                    { val: 1000, label: 'Tout' },
                ].map(({ val, label }) => (
                    <button
                        key={val}
                        onClick={() => setPreset(val)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-200 border",
                            userTantiemes === val
                                ? "bg-gold text-black border-gold"
                                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
