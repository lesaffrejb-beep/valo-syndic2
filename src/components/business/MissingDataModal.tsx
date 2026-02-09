"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Building2, Calendar, Euro, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MissingDataModalProps {
    isOpen: boolean;
    missingFields: string[];
    onClose: () => void;
    onSubmit: (data: Record<string, any>) => void;
    isLoading?: boolean;
}

export function MissingDataModal({
    isOpen,
    missingFields,
    onClose,
    onSubmit,
    isLoading = false,
}: MissingDataModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Reset form when modal opens with new fields
    useEffect(() => {
        if (isOpen) {
            setFormData({});
        }
    }, [isOpen, missingFields]);

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Mapping fields to labels and icons
    type FieldConfigItem = { label: string; icon: React.ReactNode; type: string; placeholder: string; suffix?: string };
    const fieldConfig: Record<string, FieldConfigItem> = {
        surface: {
            label: "Surface Habitable Totale",
            icon: <Ruler className="w-4 h-4" />,
            type: "number",
            placeholder: "ex: 1200",
            suffix: "m²"
        },
        year: {
            label: "Année de Construction",
            icon: <Calendar className="w-4 h-4" />,
            type: "number",
            placeholder: "ex: 1975",
        },
        numberOfUnits: {
            label: "Nombre de Lots",
            icon: <Building2 className="w-4 h-4" />,
            type: "number",
            placeholder: "ex: 20",
        },
        energyBill: {
            label: "Facture Énergétique Annuelle",
            icon: <Euro className="w-4 h-4" />,
            type: "number",
            placeholder: "ex: 15000",
            suffix: "€"
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="w-full max-w-lg bg-[#0A0A0A] border border-gold/30 rounded-3xl overflow-hidden shadow-2xl shadow-gold/5"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-gold/10 text-gold">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white leading-tight">Données Manquantes</h2>
                                    <p className="text-xs text-muted">Pour valider l&apos;audit, confirmez ces infos.</p>
                                </div>
                            </div>
                            {!isLoading && (
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                {missingFields.map((field) => {
                                    const config: FieldConfigItem = fieldConfig[field] || {
                                        label: field,
                                        icon: <AlertCircle className="w-4 h-4" />,
                                        type: "text",
                                        placeholder: "...",
                                    };

                                    return (
                                        <div key={field} className="space-y-1.5">
                                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                                {config.icon}
                                                {config.label}
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type={config.type}
                                                    required
                                                    placeholder={config.placeholder}
                                                    value={formData[field] || ""}
                                                    onChange={(e) => handleChange(field, e.target.value)}
                                                    disabled={isLoading}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted/30 focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all"
                                                />
                                                {config.suffix && (
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">
                                                        {config.suffix}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-gold hover:bg-gold-light text-black font-bold text-lg rounded-xl transition-all shadow-lg shadow-gold/10 hover:shadow-gold/20"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            Calcul en cours...
                                        </span>
                                    ) : (
                                        "Lancer le Calcul"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
