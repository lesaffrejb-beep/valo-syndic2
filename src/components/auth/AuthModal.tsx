/**
 * VALO-SYNDIC — Authentication Modal
 * ===================================
 * Magic Link authentication via Supabase
 * Design: Obsidian Premium Aesthetics
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { DEFAULT_TRANSITION } from "@/lib/animations";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError("Email requis");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Email invalide");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (authError) {
                throw authError;
            }

            setSuccess(true);

            // Auto-close after showing success message
            setTimeout(() => {
                onClose();
                setEmail("");
                setSuccess(false);
                onSuccess?.();
            }, 3000);

        } catch (err) {
            console.error("Auth error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Erreur lors de l'envoi du lien. Réessayez."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setEmail("");
            setError(null);
            setSuccess(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={DEFAULT_TRANSITION}
                        className="relative w-full max-w-md bg-surface rounded-2xl border border-boundary 
                                 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-boundary bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 
                                                  flex items-center justify-center border border-primary/20">
                                        <span className="text-xl">🔐</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-main">Connexion</h2>
                                        <p className="text-xs text-muted mt-0.5">Vault Access</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center
                                             text-muted hover:text-main hover:bg-white/[0.04] 
                                             transition-all duration-200 disabled:opacity-50"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                            {!success ? (
                                <>
                                    {/* Instructions */}
                                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                                        <p className="text-sm text-muted leading-relaxed">
                                            <span className="text-primary font-medium">🔑 Magic Link:</span>{" "}
                                            Entrez votre email pour recevoir un lien de connexion sécurisé.
                                        </p>
                                    </div>

                                    {/* Email Input */}
                                    <div className="space-y-2">
                                        <label htmlFor="auth-email" className="text-sm font-medium text-main">
                                            Email
                                        </label>
                                        <input
                                            id="auth-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="votre@email.com"
                                            disabled={loading}
                                            autoFocus
                                            className="w-full px-4 py-3 bg-background border border-boundary rounded-lg
                                                     text-main text-sm placeholder:text-subtle
                                                     focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                                                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    <AnimatePresence>
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
                                    </AnimatePresence>
                                </>
                            ) : (
                                /* Success State */
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 rounded-lg bg-success/10 border border-success/30 text-center"
                                >
                                    <div className="text-4xl mb-3">📧</div>
                                    <h3 className="text-lg font-semibold text-success mb-2">
                                        Email envoyé !
                                    </h3>
                                    <p className="text-sm text-muted leading-relaxed">
                                        Consultez votre boîte mail et cliquez sur le lien pour vous connecter.
                                    </p>
                                </motion.div>
                            )}
                        </form>

                        {/* Footer */}
                        {!success && (
                            <div className="px-6 py-4 border-t border-boundary bg-white/[0.01] flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-muted
                                             hover:text-main hover:bg-white/[0.04] transition-all duration-200
                                             disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={loading || !email.trim()}
                                    className="px-6 py-2 rounded-lg text-sm font-semibold
                                             bg-primary text-white hover:bg-primary-600
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             transition-all duration-200 shadow-lg shadow-primary/20
                                             flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            🔑 Recevoir le lien
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
