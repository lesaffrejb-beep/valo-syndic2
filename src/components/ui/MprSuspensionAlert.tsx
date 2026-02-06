/**
 * MprSuspensionAlert — Banner d'alerte suspension MPR Copro
 * =========================================================
 * Affiche une alerte lorsque MaPrimeRénov' Copropriété est suspendue
 * suite à l'absence de vote de la Loi de Finances.
 *
 * AUDIT 31/01/2026: Composant créé pour transparence réglementaire
 * Source: Bercy Infos 31/12/2025 - "cette aide est suspendue au 1er janvier 2026"
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isMprCoproSuspended, getRegulationStatus } from "@/lib/market-data";

interface MprSuspensionAlertProps {
    /** Permet de forcer l'affichage (pour tests) */
    forceShow?: boolean;
    /** Callback quand l'utilisateur ferme l'alerte */
    onDismiss?: () => void;
    /** Variante d'affichage */
    variant?: "banner" | "inline" | "compact";
}

export function MprSuspensionAlert({
    forceShow = false,
    onDismiss,
    variant = "banner",
}: MprSuspensionAlertProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    // Vérifier si on doit afficher l'alerte
    const shouldShow = forceShow || isMprCoproSuspended();
    const regulation = getRegulationStatus();

    if (!shouldShow || isDismissed) {
        return null;
    }

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    // Variante Banner (pleine largeur, en haut de page)
    if (variant === "banner") {
        return (
            <AnimatePresence>
                <motion.div
                    className="w-full bg-warning-900/90 border-b border-warning-500/50 px-4 py-3"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
                            <div>
                                <p className="text-sm font-semibold text-warning-200">
                                    MaPrimeRénov&apos; Copropriété suspendue depuis le 1er janvier 2026
                                </p>
                                <p className="text-xs text-warning-300/80 mt-1">
                                    En l&apos;absence de Loi de Finances 2026, le guichet ANAH est temporairement fermé aux nouveaux dossiers.
                                    {regulation.loiSpeciale && (
                                        <span className="block mt-1 text-warning-400/70">
                                            Réf: {regulation.loiSpeciale}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-warning-400 hover:text-warning-200 transition-colors p-1"
                            aria-label="Fermer l'alerte"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Variante Inline (dans le flux du contenu)
    if (variant === "inline") {
        return (
            <motion.div
                className="rounded-xl border border-warning-500/40 bg-warning-900/20 p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-start gap-3">
                    <span className="text-lg">⚠️</span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-warning-300">
                            Aide temporairement suspendue
                        </p>
                        <p className="text-xs text-muted mt-1">
                            MaPrimeRénov&apos; Copropriété n&apos;accepte plus de nouveaux dossiers depuis le 01/01/2026.
                            Les calculs affichés restent valides pour préparer votre dossier dès réouverture du guichet.
                        </p>
                        <a
                            href="https://www.anah.gouv.fr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-warning-400 hover:text-warning-300 mt-2 transition-colors"
                        >
                            Suivre l&apos;actualité sur anah.gouv.fr
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Variante Compact (badge discret)
    return (
        <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning-900/30 border border-warning-500/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <span className="text-sm">⚠️</span>
            <span className="text-xs font-medium text-warning-300">
                MPR Copro suspendue
            </span>
        </motion.div>
    );
}

/**
 * Hook pour vérifier le statut MPR
 * Utile pour conditionner l'affichage dans d'autres composants
 */
export function useMprStatus() {
    const isSuspended = isMprCoproSuspended();
    const regulation = getRegulationStatus();

    return {
        isSuspended,
        regulation,
        suspensionDate: regulation.suspensionDate,
        canPrepareProject: true, // On peut toujours préparer même si suspendu
    };
}
