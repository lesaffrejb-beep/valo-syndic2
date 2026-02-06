/**
 * LegalWarning — Composant d'alerte réglementaire
 * Affiche le disclaimer obligatoire OPQIBI.
 */
import { LEGAL } from "@/lib/constants";
import { AlertTriangle, BarChart3 } from "lucide-react";

interface LegalWarningProps {
    variant?: "inline" | "banner" | "footer";
    className?: string;
}

export function LegalWarning({
    variant = "inline",
    className = "",
}: LegalWarningProps) {
    const baseStyles = "text-xs text-muted flex items-start gap-2";

    const variantStyles = {
        inline: "italic py-2 opacity-60",
        banner: "py-4 justify-center italic bg-white/5",
        footer: "py-4 justify-center border-t border-white/10 mt-8",
    };

    return (
        <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 opacity-70" />
            <p>{LEGAL.disclaimer}</p>
        </div>
    );
}

/**
 * DVFDisclaimer — Mention source données DVF
 */
export function DVFDisclaimer({ className = "" }: { className?: string }) {
    return (
        <div className={`text-[10px] text-muted/50 italic flex items-center gap-1.5 ${className}`}>
            <BarChart3 className="w-3 h-3" />
            <p>{LEGAL.dvfDisclaimer}</p>
        </div>
    );
}
