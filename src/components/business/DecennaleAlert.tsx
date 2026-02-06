"use client";

import { motion } from "framer-motion";
import { type DecennaleStatus } from "@/services/dpeService";

interface DecennaleAlertProps {
    status: DecennaleStatus;
}

/**
 * Alerte Décennale - V2 Quick Win
 * Affiche une alerte rouge si l'immeuble est sous garantie décennale
 */
export function DecennaleAlert({ status }: DecennaleAlertProps) {
    if (!status.isActive) return null;

    const urgencyColors = {
        critical: {
            bg: "bg-danger/10",
            border: "border-danger/30",
            text: "text-danger",
            glow: "shadow-danger/20"
        },
        warning: {
            bg: "bg-amber-500/10",
            border: "border-amber-500/30",
            text: "text-amber-400",
            glow: "shadow-amber-500/20"
        },
        info: {
            bg: "bg-blue-500/10",
            border: "border-blue-500/30",
            text: "text-blue-400",
            glow: "shadow-blue-500/20"
        }
    };

    const colors = urgencyColors[status.urgencyLevel];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
                ${colors.bg} ${colors.border} 
                border rounded-xl p-4 
                shadow-lg ${colors.glow}
            `}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-2xl">
                    {status.urgencyLevel === 'critical' ? '🚨' : '⚠️'}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h4 className={`font-bold ${colors.text} text-sm uppercase tracking-wide mb-1`}>
                        {status.urgencyLevel === 'critical'
                            ? 'URGENCE JURIDIQUE'
                            : 'ATTENTION DÉCENNALE'}
                    </h4>

                    <p className="text-main text-sm mb-2">
                        Immeuble sous <strong>garantie décennale</strong> (construit en {status.anneeConstruction}).
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                            ⏰ Expiration : <strong className={colors.text}>{status.expirationYear}</strong>
                        </span>
                        <span>
                            {status.yearsRemaining > 0
                                ? `${status.yearsRemaining} an${status.yearsRemaining > 1 ? 's' : ''} restant${status.yearsRemaining > 1 ? 's' : ''}`
                                : 'Expire cette année !'}
                        </span>
                    </div>

                    {status.urgencyLevel === 'critical' && (
                        <p className="text-xs text-danger mt-2 font-medium">
                            🛡️ Lancement d&apos;audit impératif avant expiration de la garantie.
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
