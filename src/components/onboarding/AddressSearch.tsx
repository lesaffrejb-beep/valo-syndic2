/**
 * ADDRESS SEARCH — Barre de recherche d'adresse premium
 * =====================================================
 * Autocomplete intelligent avec hybrid search (local + API)
 * et animations fluides.
 * 
 * @author JB
 * @date 2026-02-03
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Zap, Loader2 } from "lucide-react";
import { type HybridSearchResult } from "@/services/dpeService";

interface AddressSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: HybridSearchResult) => void;
  results: HybridSearchResult[];
  isSearching: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressSearch({
  value,
  onChange,
  onSelect,
  results,
  isSearching,
  placeholder = "Commencez par l'adresse de l'immeuble...",
  disabled = false,
}: AddressSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          onSelect(results[selectedIndex]);
          setIsFocused(false);
        }
        break;
      case "Escape":
        setIsFocused(false);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex];
      selectedItem?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = (result: HybridSearchResult) => {
    onSelect(result);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const showResults = isFocused && (results.length > 0 || isSearching);

  return (
    <div className="relative w-full">
      {/* Input principal */}
      <motion.div
        className={`
          relative flex items-center gap-3 
          bg-white/5 border border-white/10 rounded-2xl
          px-4 py-4
          transition-all duration-300
          ${isFocused ? "border-gold/50 bg-white/10 shadow-lg shadow-gold/5" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <Search className={`w-5 h-5 ${isFocused ? "text-gold" : "text-muted"}`} />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay pour permettre le clic sur un résultat
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="
            flex-1 bg-transparent text-white text-lg font-medium
            placeholder:text-muted/50
            focus:outline-none
          "
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="address-results"
          aria-haspopup="listbox"
        />

        {/* Indicateur d'état */}
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="w-5 h-5 text-gold animate-spin" />
            </motion.div>
          ) : value ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* Résultats de recherche */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="
              absolute z-50 top-full left-0 right-0 mt-2
              bg-[#0A0A0A]/95 backdrop-blur-xl
              border border-white/10 rounded-2xl
              shadow-2xl overflow-hidden
            "
          >
            {isSearching && results.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted">Recherche en cours...</p>
              </div>
            ) : results.length === 0 && value.length >= 3 ? (
              <div className="px-4 py-6 text-center">
                <MapPin className="w-5 h-5 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted">Aucun résultat trouvé</p>
                <p className="text-xs text-muted/50 mt-1">
                  Essayez avec une autre orthographe
                </p>
              </div>
            ) : (
              <ul
                ref={listRef}
                id="address-results"
                className="max-h-80 overflow-y-auto py-2"
                role="listbox"
              >
                {results.map((result, index) => (
                  <li
                    key={`${result.sourceType}-${index}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      px-4 py-3 mx-2 rounded-xl cursor-pointer
                      transition-all duration-150
                      border border-transparent
                      ${index === selectedIndex
                        ? result.sourceType === "local"
                          ? "bg-gold/20 border-gold/30"
                          : "bg-white/10 border-white/20"
                        : result.sourceType === "local"
                          ? "hover:bg-gold/10 border-gold/5"
                          : "hover:bg-white/5"
                      }
                    `}
                  >
                    {result.sourceType === "local" && result.dpeData ? (
                      // Résultat local avec DPE
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-gold/20 rounded-lg">
                          <Zap className="w-4 h-4 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {result.address}
                            </p>
                            <span className="
                              text-[10px] font-bold px-1.5 py-0.5 rounded
                              bg-gold text-black
                            ">
                              DPE {result.dpeData.dpe}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            Donnée certifiée • {result.postalCode} {result.city}
                            {result.dpeData.annee && ` • ${result.dpeData.annee}`}
                            {result.dpeData.surface && ` • ${result.dpeData.surface}m²`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Résultat API standard
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-white/10 rounded-lg">
                          <MapPin className="w-4 h-4 text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {result.address}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {result.postalCode} {result.city}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Footer avec attribution */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/5">
              <p className="text-[10px] text-muted/50 text-center">
                Recherche locale + API Adresse (
                <a
                  href="https://adresse.data.gouv.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold/70 hover:text-gold"
                  onClick={(e) => e.stopPropagation()}
                >
                  data.gouv.fr
                </a>
                )
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
