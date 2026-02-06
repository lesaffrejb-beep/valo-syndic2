"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dpeService, type DPEEntry, type HybridSearchResult } from "@/services/dpeService";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { type DPELetter } from "@/lib/constants";
import { Search, ChevronDown, MapPin, Coins, Droplet, Flame, Zap, ArrowRight, Rocket } from "lucide-react";

interface MagicalAddressInputProps {
    onStartSimulation: (data: {
        address: string;
        postalCode: string;
        city: string;
        numberOfUnits: number;
        currentDPE: DPELetter;
        targetDPE: DPELetter;
        heatingSystem: "fioul" | "gaz" | "elec";
        estimatedCostHT: number;
        pricePerSqm: number;
    }) => void;
    className?: string;
}

const DPE_OPTIONS: DPELetter[] = ["A", "B", "C", "D", "E", "F", "G"];

export function MagicalAddressInput({ onStartSimulation, className = "" }: MagicalAddressInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isUnfolded, setIsUnfolded] = useState(true);
    const [hybridResults, setHybridResults] = useState<HybridSearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State (Manual Override)
    const [numberOfUnits, setNumberOfUnits] = useState(20);
    const [currentDPE, setCurrentDPE] = useState<DPELetter>("F");
    const [targetDPE, setTargetDPE] = useState<DPELetter>("C");
    const [heatingSystem, setHeatingSystem] = useState<"fioul" | "gaz" | "elec">("gaz");
    const [estimatedCostHT, setEstimatedCostHT] = useState(400000);
    const [pricePerSqm, setPricePerSqm] = useState(3200);
    const [selectedAddress, setSelectedAddress] = useState<HybridSearchResult | null>(null);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Hybrid Search Logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSelectedIndex(-1);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            if (value.length >= 3) {
                setIsLoading(true);
                dpeService.hybridSearch(value, 5).then((results) => {
                    setHybridResults(results);
                    setIsLoading(false);
                });
            } else {
                setHybridResults([]);
            }
        }, 300);
    };

    const handleSelectAddress = (result: HybridSearchResult) => {
        setSelectedAddress(result);
        setInputValue(result.address);
        setHybridResults([]);
        setIsUnfolded(true);

        // Pre-fill with available data
        if (result.dpeData) {
            setCurrentDPE(result.dpeData.dpe);
            // Example: set surface or other data if needed
        }
    };

    return (
        <div className={`relative w-full max-w-2xl mx-auto space-y-4 ${className}`}>
            {/* SEARCH BAR CONTAINER */}
            <div className="relative group">
                <div className={`
                    relative w-full bg-surface border border-white/5 shadow-tactile-inner 
                    rounded-3xl p-2 transition-all duration-500 z-50
                    ${isFocused ? 'border-gold/20 shadow-glow-vibrant scale-[1.01]' : 'hover:border-white/10'}
                `}>
                    <div className="flex items-center gap-2">
                        <div className="pl-4 text-gold/40">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onFocus={() => setIsFocused(true)}
                            placeholder="Rechercher l'adresse de la copropriété..."
                            className="w-full bg-transparent border-none text-lg text-white placeholder-white/10 focus:ring-0 px-2 h-14 font-light tracking-tight"
                        />
                        <button
                            onClick={() => isUnfolded ? setIsUnfolded(false) : setIsUnfolded(true)}
                            className="bg-white text-black rounded-2xl px-6 h-12 font-bold hover:bg-gray-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.2)] active:scale-95 shrink-0 flex items-center gap-2"
                        >
                            <span className="hidden sm:inline text-sm">{isUnfolded ? "Masquer" : "Infos Manuelles"}</span>
                            <span className="sm:hidden text-sm">{isUnfolded ? "Masq." : "Infos"}</span>
                            <motion.span
                                animate={{ rotate: isUnfolded ? 180 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <ChevronDown className="w-4 h-4 text-black" />
                            </motion.span>
                        </button>
                    </div>

                    {/* SUGGESTIONS POPUP (Treated as a floating tactile card) */}
                    <AnimatePresence>
                        {isFocused && hybridResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                className="absolute top-[calc(100%+12px)] left-0 w-full bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[60] p-2"
                            >
                                {hybridResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectAddress(result)}
                                        className="w-full text-left px-5 py-4 hover:bg-white/5 rounded-2xl transition-all group/item flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/item:border-gold/30 group-hover/item:bg-gold/5 transition-all">
                                                <MapPin className="w-5 h-5 text-white/40 group-hover/item:text-gold transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium tracking-tight">{result.address}</p>
                                                <p className="text-white/30 text-xs font-mono lowercase">{result.postalCode} {result.city}</p>
                                            </div>
                                        </div>
                                        {result.dpeData && (
                                            <div className="flex flex-col items-end">
                                                <span className={`
                                                    font-mono text-[10px] px-2 py-1 rounded-lg border font-bold
                                                    ${['A', 'B'].includes(result.dpeData.dpe) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                        ['F', 'G'].includes(result.dpeData.dpe) ? 'bg-danger/10 border-danger/20 text-danger' :
                                                            'bg-gold/10 border-gold/20 text-gold'}
                                                `}>
                                                    DPE {result.dpeData.dpe}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* DYNAMIC VIBRANT GLOW (Animated) */}
                <motion.div
                    animate={{
                        scale: isFocused ? [1, 1.2, 1] : 1,
                        opacity: isFocused ? [0.3, 0.5, 0.3] : 0.2
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gold/10 blur-[80px] rounded-full pointer-events-none"
                />
            </div>

            {/* UNFOLDED PANEL: TACTILE GLASS PANELS */}
            <AnimatePresence>
                {isUnfolded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, scale: 0.98 }}
                        animate={{ height: "auto", opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="relative z-40 overflow-hidden pt-2"
                    >
                        <div className="bg-surface/80 backdrop-blur-3xl border border-white/5 rounded-[32px] p-8 shadow-2xl space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left Section: Geometry & Finance */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-bold">Volumes & Capacité</label>
                                        </div>
                                        <div className="bg-app/40 rounded-2xl p-4 border border-white/5 shadow-tactile-inner group hover:border-white/10 transition-all space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-sm font-medium">Nombre de lots</span>
                                                <span className="text-white/40 text-xs font-mono">{numberOfUnits}</span>
                                            </div>
                                            <NumberStepper
                                                value={numberOfUnits}
                                                onChange={setNumberOfUnits}
                                                min={2}
                                                max={500}
                                                className="h-12 bg-white/5 border-none shadow-glass rounded-xl"
                                            />
                                            <div className="h-px bg-white/5" />
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-white text-sm font-medium">Coût travaux (HT)</span>
                                                <div className="flex items-baseline gap-2">
                                                    <input
                                                        type="number"
                                                        value={estimatedCostHT}
                                                        onChange={(e) => setEstimatedCostHT(Number(e.target.value))}
                                                        className="bg-transparent border-none text-xl text-white focus:ring-0 w-36 p-0 font-bold tracking-tight text-right"
                                                    />
                                                    <span className="text-white/30 text-xs font-medium uppercase tracking-widest">EUR</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-bold">Valorisation locale</label>
                                        <div className="bg-app/40 rounded-2xl p-5 border border-white/5 shadow-tactile-inner focus-within:border-gold/30 transition-all flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-focus-within:border-gold/20 transition-all">
                                                <Coins className="w-6 h-6 text-white/60 group-focus-within:text-gold" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-white/20 font-mono uppercase mb-0.5">Prix estimé m²</p>
                                                <div className="flex items-baseline gap-1">
                                                    <input
                                                        type="number"
                                                        value={pricePerSqm}
                                                        onChange={(e) => setPricePerSqm(Number(e.target.value))}
                                                        className="bg-transparent border-none text-2xl text-white focus:ring-0 w-24 p-0 font-bold tracking-tight"
                                                    />
                                                    <span className="text-white/30 text-sm font-medium uppercase tracking-widest">EUR / M²</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Energy & Tech */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-bold">Statut Énergétique</label>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between px-1 mb-2">
                                                    <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">DPE Actuel</span>
                                                    <span className="text-[10px] text-white/20 font-mono">{currentDPE}</span>
                                                </div>
                                                <div className="bg-app/40 rounded-2xl p-2 border border-white/5 shadow-tactile-inner grid grid-cols-7 gap-1">
                                                    {DPE_OPTIONS.map((dpe) => (
                                                        <button
                                                            key={dpe}
                                                            onClick={() => setCurrentDPE(dpe)}
                                                            className={`
                                                                aspect-square flex items-center justify-center text-sm font-bold rounded-xl transition-all
                                                                ${currentDPE === dpe
                                                                    ? 'bg-white text-black shadow-[0_4px_15px_rgba(255,255,255,0.3)] scale-[1.05] z-10'
                                                                    : 'text-white/20 hover:text-white/40 hover:bg-white/5'}
                                                            `}
                                                        >
                                                            {dpe}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between px-1 mb-2">
                                                    <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">DPE Projeté</span>
                                                    <span className="text-[10px] text-white/20 font-mono">{targetDPE}</span>
                                                </div>
                                                <div className="bg-app/40 rounded-2xl p-2 border border-white/5 shadow-tactile-inner grid grid-cols-7 gap-1">
                                                    {DPE_OPTIONS.map((dpe) => (
                                                        <button
                                                            key={dpe}
                                                            onClick={() => setTargetDPE(dpe)}
                                                            className={`
                                                                aspect-square flex items-center justify-center text-sm font-bold rounded-xl transition-all
                                                                ${targetDPE === dpe
                                                                    ? 'bg-white text-black shadow-[0_4px_15px_rgba(255,255,255,0.3)] scale-[1.05] z-10'
                                                                    : 'text-white/20 hover:text-white/40 hover:bg-white/5'}
                                                            `}
                                                        >
                                                            {dpe}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-[9px] text-emerald-500/60 uppercase tracking-widest font-bold">Performant</span>
                                            <span className="text-[9px] text-danger/60 uppercase tracking-widest font-bold">Passoire</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-bold">Energie Primaire</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: "fioul" as const, label: "Fioul", Icon: Droplet, color: "hsla(10, 60%, 65%, 0.1)" },
                                                { id: "gaz" as const, label: "Gaz", Icon: Flame, color: "rgba(245, 158, 11, 0.1)" },
                                                { id: "elec" as const, label: "Élec", Icon: Zap, color: "rgba(59, 130, 246, 0.1)" }
                                            ].map((sys) => (
                                                <button
                                                    key={sys.id}
                                                    onClick={() => setHeatingSystem(sys.id)}
                                                    className={`
                                                        relative flex flex-col items-center justify-center py-4 rounded-2xl border transition-all gap-2 overflow-hidden
                                                        ${heatingSystem === sys.id
                                                            ? 'border-gold/30 scale-[1.02] shadow-glass'
                                                            : 'bg-app/20 border-white/5 text-white/20 hover:border-white/10'}
                                                    `}
                                                >
                                                    {heatingSystem === sys.id && (
                                                        <motion.div
                                                            layoutId="heating-bg"
                                                            className="absolute inset-0 z-0 bg-gold/5"
                                                        />
                                                    )}
                                                    <span className={`text-2xl relative z-10 ${heatingSystem === sys.id ? 'opacity-100' : 'opacity-30'}`}>
                                                        <sys.Icon className="w-6 h-6" />
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest relative z-10 ${heatingSystem === sys.id ? 'text-gold' : ''}`}>{sys.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        if (selectedAddress) {
                                            onStartSimulation({
                                                address: selectedAddress.address,
                                                postalCode: selectedAddress.postalCode,
                                                city: selectedAddress.city,
                                                numberOfUnits,
                                                currentDPE,
                                                targetDPE,
                                                heatingSystem,
                                                estimatedCostHT,
                                                pricePerSqm
                                            });
                                        }
                                    }}
                                    disabled={!selectedAddress}
                                    className={`
                                        w-full py-5 rounded-[20px] font-bold tracking-[0.2em] uppercase text-sm transition-all relative overflow-hidden group
                                        ${selectedAddress
                                            ? 'bg-gold text-obsidian shadow-glow-vibrant hover:bg-[#E5C158] hover:scale-[1.01]'
                                            : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}
                                    `}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        <Rocket className="w-5 h-5" /> Lancer la simulation tactique
                                    </span>
                                    {selectedAddress && (
                                        <motion.div
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                                        />
                                    )}
                                </button>
                                <p className="text-center text-[9px] text-white/20 font-mono mt-4 uppercase tracking-[0.3em]">
                                    Précision Engine 2026 • Données Etalab & ADEME verifiées
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
