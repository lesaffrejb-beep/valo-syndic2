"use client";

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
        form.selectAddress(result);
        onAuditInit(result.address, result);
    };

    const handleChange = (val: string) => {
        form.setSearchQuery(val);
        if (onReset) onReset();
    };

    return (
        <div className={`w-full max-w-3xl mx-auto ${className}`}>
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
                    <span className="block text-gold mb-2">Audit Flash.</span>
                    L&apos;expertise instantanée.
                </h1>
                <p className="text-muted text-lg max-w-xl mx-auto">
                    Entrez l&apos;adresse de la copropriété pour obtenir une analyse financière et énergétique immédiate.
                </p>
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-full left-0 right-0 mt-4 flex items-center justify-center gap-3 text-gold"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Analyse Cadastrale en cours...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
