"use client";

import { useState, useRef } from "react";
import { useBrandStore } from "@/stores/useBrandStore";
import { motion, AnimatePresence } from "framer-motion";

interface BrandingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BrandingModal({ isOpen, onClose }: BrandingModalProps) {
    const brand = useBrandStore((state) => state.brand);
    const updateBrand = useBrandStore((state) => state.updateBrand);
    const resetBrand = useBrandStore((state) => state.resetBrand);
    const [tempBrand, setTempBrand] = useState(brand);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempBrand((prev) => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        updateBrand(tempBrand);
        onClose();
    };

    const handleReset = () => {
        resetBrand();
        setTempBrand({
            agencyName: "VALO-SYNDIC",
            logoUrl: null,
            primaryColor: "#0f172a",
            contactEmail: "contact@valo-syndic.fr",
            contactPhone: "01 23 45 67 89",
        }); // Update local state as well
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-lg bg-surface rounded-2xl border border-boundary shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-boundary flex justify-between items-center">
                        <h2 className="text-xl font-bold text-main">Personnalisation (White Label)</h2>
                        <button onClick={onClose} className="text-muted hover:text-main">✕</button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-main">Logo Agence</label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-20 h-20 rounded-lg border-2 border-dashed border-boundary flex items-center justify-center overflow-hidden bg-white/5"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {tempBrand.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={tempBrand.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-2xl">📷</span>
                                    )}
                                </div>
                                <div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn-secondary text-xs mb-2"
                                    >
                                        Parcourir...
                                    </button>
                                    <p className="text-xs text-muted">PNG, JPG (Max 1Mo)</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Agency Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-main">Nom de l&apos;Agence</label>
                            <input
                                type="text"
                                value={tempBrand.agencyName}
                                onChange={(e) => setTempBrand({ ...tempBrand, agencyName: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-boundary rounded-lg text-main focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-main">Email Contact</label>
                                <input
                                    type="email"
                                    value={tempBrand.contactEmail}
                                    onChange={(e) => setTempBrand({ ...tempBrand, contactEmail: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-boundary rounded-lg text-main text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-main">Téléphone</label>
                                <input
                                    type="tel"
                                    value={tempBrand.contactPhone}
                                    onChange={(e) => setTempBrand({ ...tempBrand, contactPhone: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-boundary rounded-lg text-main text-sm"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="p-6 border-t border-boundary bg-surface-hover flex justify-between items-center">
                        <button
                            onClick={handleReset}
                            className="text-xs text-danger hover:text-danger/80 underline"
                        >
                            Réinitialiser
                        </button>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="btn-ghost text-sm">Annuler</button>
                            <button onClick={handleSave} className="btn-primary text-sm">Enregistrer</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
