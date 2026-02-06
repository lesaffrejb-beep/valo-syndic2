"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, CheckCircle2 } from "lucide-react";
import { usePropertyEnrichment } from "@/hooks/usePropertyEnrichment";
import type { AddressFeature } from "@/lib/api";
import { dpeService, type DPEEntry, type HybridSearchResult } from "@/services/dpeService";
import { useCoproSearch, type CoproSearchResult } from "@/hooks/useCoproSearch";

interface AddressAutocompleteProps {
    /** Valeur initiale */
    defaultValue?: string;
    /** Callback quand une adresse est sélectionnée */
    onSelect?: (data: {
        address: string;
        postalCode: string;
        city: string;
        cityCode?: string;
        coordinates?: { longitude: number; latitude: number };
        dpeData?: {
            dpe: string;
            surface: number;
            annee?: number;
            [key: string]: any;
        };
        rnicData?: {
            numberOfLots?: number;
            syndicName?: string;
            constructionYear?: number;
        };
    }) => void;
    /** Callback quand l'enrichissement est terminé */
    onEnriched?: (property: ReturnType<typeof usePropertyEnrichment>["property"]) => void;
    /** Placeholder */
    placeholder?: string;
    /** Classe CSS additionnelle */
    className?: string;
    /** Désactiver le champ */
    disabled?: boolean;
}

/**
 * Champ d'adresse avec auto-complétion et enrichissement automatique
 *
 * Utilise l'API Adresse (BAN) pour :
 * - Auto-complétion en temps réel
 * - Normalisation de l'adresse
 * - Récupération des coordonnées GPS
 *
 * Et dpeService pour :
 * - Recherche locale dans dpe-49.json (prioritaire)
 *
 * Puis enrichit avec :
 * - Données cadastrales
 * - Prix immobiliers DVF
 */
export function AddressAutocomplete({
    defaultValue = "",
    onSelect,
    onEnriched,
    placeholder = "Commencez à taper une adresse...",
    className = "",
    disabled = false,
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Hybrid Search Results (Local + API)
    const [hybridResults, setHybridResults] = useState<HybridSearchResult[]>([]);
    const { results: rnicResults, searchCopro, clearResults: clearRnicResults, isLoading: isRnicLoading } = useCoproSearch();

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const {
        isLoading,
        isEnriching,
        suggestions,
        searchAddress,
        selectAddress,
        clearSuggestions,
        enrichFromAddress,
        property,
    } = usePropertyEnrichment();

    // Notifier quand l'enrichissement est terminé
    useEffect(() => {
        if (property && onEnriched) {
            onEnriched(property);
        }
    }, [property, onEnriched]);

    // Preload DPE data on mount
    useEffect(() => {
        dpeService.fetchData();
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSelectedIndex(-1);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce search (300ms)
        searchTimeoutRef.current = setTimeout(() => {
            if (value.length >= 3) {
                dpeService.hybridSearch(value, 6).then(setHybridResults).catch(err => console.error("hybridSearch error:", err));
                searchCopro(value);
            } else {
                setHybridResults([]);
                clearRnicResults();
            }
        }, 300);
    };

    

    const handleSelect = (feature: AddressFeature) => {
        const props = feature.properties;

        setInputValue(props.label);
        clearSuggestions();
        setHybridResults([]);
        setIsFocused(false);

        // Callback immédiat avec les données de base
        if (onSelect) {
            onSelect({
                address: props.label,
                postalCode: props.postcode,
                city: props.city,
                cityCode: props.citycode,
                coordinates: {
                    longitude: feature.geometry.coordinates[0],
                    latitude: feature.geometry.coordinates[1],
                },
            });
        }

        // Lancer l'enrichissement complet en arrière-plan
        selectAddress(feature);
    };

    // Handler for hybrid search selection
    const handleSelectHybrid = (result: HybridSearchResult) => {
        setInputValue(result.address);
        setHybridResults([]);
        clearRnicResults();
        setIsFocused(false);

        if (onSelect) {
            onSelect({
                address: result.address,
                postalCode: result.postalCode,
                city: result.city,
                ...(result.cityCode ? { cityCode: result.cityCode } : {}),
                ...(result.coordinates ? { coordinates: result.coordinates } : {}),
                ...(result.dpeData ? { dpeData: result.dpeData } : {}),
            });
        }
    };

    const handleSelectRnic = (result: CoproSearchResult) => {
        setInputValue(result.address);
        setHybridResults([]);
        clearRnicResults();
        setIsFocused(false);

        if (onSelect) {
            onSelect({
                address: result.address,
                postalCode: result.postalCode,
                city: result.city,
                ...(result.cityCode ? { cityCode: result.cityCode } : {}),
                ...(result.coordinates ? { coordinates: result.coordinates } : {}),
                ...(result.dpeData ? { dpeData: result.dpeData } : {}),
                rnicData: {
                    ...(result.numberOfLots ? { numberOfLots: result.numberOfLots } : {}),
                    ...(result.syndicName ? { syndicName: result.syndicName } : {}),
                    ...(result.constructionYear ? { constructionYear: result.constructionYear } : {}),
                }
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalLength = hybridResults.length + rnicResults.length;
        if (totalLength === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < totalLength - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0) {
                    if (selectedIndex < rnicResults.length) {
                        const item = rnicResults[selectedIndex];
                        if (item) handleSelectRnic(item);
                    } else if (selectedIndex < totalLength) {
                        const item = hybridResults[selectedIndex - rnicResults.length];
                        if (item) handleSelectHybrid(item);
                    }
                }
                break;
            case "Escape":
                setHybridResults([]);
                clearRnicResults();
                setIsFocused(false);
                break;
        }
    };

    const handleBlur = () => {
        // Délai pour permettre le clic sur une suggestion
        setTimeout(() => {
            setIsFocused(false);
            setHybridResults([]);
        }, 200);
    };

    const showSuggestions = isFocused && (hybridResults.length > 0 || rnicResults.length > 0);

    return (
        <div className={`relative ${className}`}>
            {/* Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="input w-full pr-10 h-12"
                    name="address"
                    autoComplete="street-address"
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                    aria-controls="address-suggestions"
                />

                {/* Loading indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    )}
                    {isEnriching && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1"
                        >
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                            <span className="text-xs text-success">Enrichissement...</span>
                        </motion.div>
                    )}
                    {!isLoading && !isEnriching && (
                        <div className="flex items-center gap-2">
                            {inputValue.length > 0 && (
                                <button
                                    onClick={() => setInputValue("")}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-3 h-3 text-muted" />
                                </button>
                            )}
                            <svg
                                className="w-4 h-4 text-muted"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Suggestions dropdown */}
            <AnimatePresence>
                {showSuggestions && (
                    <motion.ul
                        ref={listRef}
                        id="address-suggestions"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[100] w-full mt-1 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto"
                        role="listbox"
                    >
                        {/* RNIC RESULTS (SUPABASE) */}
                        {rnicResults.map((result, index) => (
                            <li
                                key={`rnic-${index}`}
                                role="option"
                                aria-selected={index === selectedIndex}
                                className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.03] ${index === selectedIndex
                                    ? "bg-amber-400/20 text-amber-300"
                                    : "hover:bg-surface-hover bg-amber-400/5"
                                    }`}
                                onClick={() => handleSelectRnic(result)}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-amber-400 mt-0.5">✨</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-main">
                                                {result.address}
                                            </p>
                                            <span className="text-[10px] bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                RNIC
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted mt-0.5">
                                            {result.postalCode} {result.city} • <span className="text-amber-200/80">{result.numberOfLots ?? '?'} lots</span> {result.syndicName ? `• ${result.syndicName}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}

                        {/* EXISTING HYBRID RESULTS */}
                        {hybridResults.map((result, index) => {
                            const globalIndex = rnicResults.length + index;
                            return (
                                <li
                                    key={`${result.sourceType}-${index}`}
                                    role="option"
                                    aria-selected={globalIndex === selectedIndex}
                                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.03] ${globalIndex === selectedIndex
                                        ? result.sourceType === 'local'
                                            ? "bg-primary/20 text-primary"
                                            : "bg-primary/10 text-primary"
                                        : result.sourceType === 'local'
                                            ? "hover:bg-surface-hover bg-primary/5"
                                            : "hover:bg-surface-hover"
                                        }`}
                                    onClick={() => handleSelectHybrid(result)}
                                >
                                    {result.sourceType === 'local' && result.dpeData ? (
                                        // LOCAL RESULT with DPE data
                                        <div className="flex items-start gap-3">
                                            <span className="text-primary mt-0.5">⚡</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-main">
                                                        {result.address}
                                                    </p>
                                                    <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded shadow-sm">
                                                        DPE {result.dpeData.dpe}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted mt-0.5">
                                                    Donnée certifiée • Construit en {result.dpeData.annee} • {result.dpeData.surface}m²
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        // API RESULT (standard address)
                                        <div className="flex items-start gap-3">
                                            <span className="text-muted mt-0.5">📍</span>
                                            <div>
                                                <p className="text-sm font-medium text-main">
                                                    {result.address}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    {result.postalCode} {result.city}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}

                        {/* Attribution */}
                        <li className="px-4 py-2 bg-surface-hover border-t border-boundary">
                            <p className="text-[10px] text-subtle flex items-center gap-1">
                                <span>Recherche locale + API</span>
                                <a
                                    href="https://adresse.data.gouv.fr"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Adresse Gouv
                                </a>
                            </p>
                        </li>
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
