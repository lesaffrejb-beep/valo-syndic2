/**
 * VALO-SYNDIC — JSON Importer (Ghost Extension Integration)
 * ===========================================================
 * Import des lots depuis l'extension Chrome "VALO-SYNDIC Ghost"
 * Design: Obsidian Aesthetics
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GhostExtensionImportSchema, type GhostExtensionImport } from "@/lib/schemas";
import { DEFAULT_TRANSITION } from "@/lib/animations";

interface JsonImporterProps {
    onImport: (data: GhostExtensionImport) => void;
}

export function JsonImporter({ onImport }: JsonImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleImport = () => {
        try {
            setError(null);
            setSuccess(false);

            // Parse JSON
            const parsed = JSON.parse(jsonInput);

            // Validate with Zod
            const validated = GhostExtensionImportSchema.parse(parsed);

            // Success!
            onImport(validated);
            setSuccess(true);

            // Auto-close after success
            setTimeout(() => {
                setIsOpen(false);
                setJsonInput("");
                setSuccess(false);
            }, 2000);

        } catch (err) {
            if (err instanceof SyntaxError) {
                setError("JSON invalide. Vérifiez la syntaxe.");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Erreur inconnue lors de l'import.");
            }
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="group relative h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] 
                           hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-200 flex items-center gap-2.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <span className="text-sm font-medium text-main group-hover:text-primary transition-colors hidden xl:inline">
                    Importer depuis Ghost
                </span>
                <span className="text-sm font-medium text-main group-hover:text-primary transition-colors xl:hidden">
                    Ghost
                </span>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={DEFAULT_TRANSITION}
                            className="relative w-full max-w-2xl bg-[#0A0A0A]/95 backdrop-blur-xl rounded-2xl border border-white/10 
                                     shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-boundary bg-gradient-to-r from-white/[0.02] to-transparent">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h2 className="text-lg font-semibold text-main">Importer depuis Ghost</h2>
                                            <p className="text-xs text-muted mt-0.5">Extension VALO‑SYNDIC</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center
                                                 text-muted hover:text-main hover:bg-white/[0.04] 
                                                 transition-all duration-200"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4">
                                {/* Instructions */}
                                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                    <p className="text-sm text-muted leading-relaxed">
                                        <span className="text-primary font-medium">Instructions:</span>{" "}
                                        Collez le JSON généré par l&apos;extension Ghost ci-dessous, puis cliquez sur &quot;Importer&quot;.
                                    </p>
                                </div>

                                {/* JSON Textarea */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-main">JSON</label>
                                    <textarea
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                        placeholder={`{\n  "source": "valo-syndic-ghost",\n  "lots": [...]\n}`}
                                        rows={12}
                                        className="w-full px-4 py-3 bg-background border border-boundary rounded-lg
                                                 text-main text-sm font-mono placeholder:text-subtle
                                                 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                                                 transition-all duration-200 resize-none"
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="p-3 rounded-lg bg-danger/10 border border-danger/30"
                                    >
                                        <p className="text-sm text-danger flex items-center gap-2">
                                            <span>⚠️</span>
                                            {error}
                                        </p>
                                    </motion.div>
                                )}

                                {/* Success Message */}
                                <AnimatePresence>
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="p-3 rounded-lg bg-success/10 border border-success/30"
                                        >
                                            <p className="text-sm text-success flex items-center gap-2">
                                                <span>✅</span>
                                                Import réussi ! Fermeture automatique...
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-boundary bg-white/[0.01] flex justify-end gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted
                                             hover:text-main hover:bg-white/[0.04] transition-all duration-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!jsonInput.trim() || success}
                                    className="px-6 py-2 rounded-lg text-sm font-semibold
                                             bg-primary text-white hover:bg-primary-600
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             transition-all duration-200 shadow-lg shadow-primary/20"
                                >
                                    {success ? "✓ Importé" : "Importer"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
