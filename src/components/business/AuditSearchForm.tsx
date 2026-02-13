"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AddressSearch } from "@/components/onboarding/AddressSearch";
import { useSmartForm } from "@/hooks/useSmartForm";
import type { HybridSearchResult } from "@/services/dpeService";

interface AuditSearchFormProps {
    onAuditInit: (address: string, result: HybridSearchResult) => void;
    onReset?: () => void;
    isLoading?: boolean;
    className?: string;
}

export function AuditSearchForm({
    onAuditInit,
    onReset,
    isLoading = false,
    className = "",
}: AuditSearchFormProps) {
    const form = useSmartForm({});

    const handleSelect = async (result: HybridSearchResult) => {
        form.setSearchQuerySilent(result.address);
        form.selectAddress(result); // Trigger internal form state update if needed for reuse
        onAuditInit(result.address, result);
    };

    const handleChange = (val: string) => {
        form.setSearchQuery(val);
        if (onReset) onReset();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className={`w-full max-w-3xl mx-auto ${className}`}
        >
            <div className="text-center mb-8">
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight"
                >
                    <span className="block text-gold mb-2">Audit Flash.</span>
                    L&apos;expertise instantanée.
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted text-lg max-w-xl mx-auto"
                >
                    Entrez l&apos;adresse de la copropriété pour obtenir une analyse financière et énergétique immédiate.
                </motion.p>
            </div>

            <div className="relative">
                <AddressSearch
                    value={form.searchQuery}
                    onChange={handleChange}
                    onSelect={handleSelect}
                    results={form.searchResults}
                    isSearching={form.state === "SEARCHING"}
                    disabled={isLoading}
                    placeholder="12 rue de la Paix, Paris..."
                />

                <AnimatePresence>
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-4 flex items-center justify-center gap-3 text-gold"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Analyse Cadastrale en cours...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
