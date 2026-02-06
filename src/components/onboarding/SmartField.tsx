/**
 * SMART FIELD — Champ de formulaire intelligent
 * =============================================
 * Affiche les indicateurs de statut (auto-filled, verified, etc.)
 * avec animations premium.
 * 
 * @author JB
 * @date 2026-02-03
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Sparkles, Edit3 } from "lucide-react";
import { type FieldStatus } from "@/hooks/useSmartForm";
import { type ReactNode } from "react";

interface SmartFieldProps {
  label: string;
  name: string;
  status: FieldStatus;
  source?: string | undefined;
  confidence?: number | undefined;
  children: ReactNode;
  className?: string;
  hint?: string | undefined;
  onVerify?: () => void;
}

export function SmartField({
  label,
  name,
  status,
  source,
  confidence,
  children,
  className = "",
  hint,
  onVerify,
}: SmartFieldProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "auto-filled":
        return "border-gold/30 bg-gold/5 focus-within:border-gold/50 focus-within:bg-gold/10";
      case "verified":
        return "border-success/30 bg-success/5 focus-within:border-success/50 focus-within:bg-success/10";
      case "error":
        return "border-danger/50 bg-danger/5 focus-within:border-danger focus-within:bg-danger/10";
      case "manual":
        return "border-white/10 bg-white/5 focus-within:border-white/30 focus-within:bg-white/10";
      default:
        return "border-white/10 bg-white/5 focus-within:border-white/30 focus-within:bg-white/10";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "auto-filled":
        return <Sparkles className="w-3.5 h-3.5 text-gold" />;
      case "verified":
        return <Check className="w-3.5 h-3.5 text-success" />;
      case "error":
        return <AlertCircle className="w-3.5 h-3.5 text-danger" />;
      case "manual":
        return <Edit3 className="w-3.5 h-3.5 text-muted" />;
      default:
        return null;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "auto-filled":
        return source ? `Détecté (${source})` : "Détecté auto.";
      case "verified":
        return "Vérifié";
      case "error":
        return "À corriger";
      case "manual":
        return "Saisi manuellement";
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label avec badge de statut */}
      <div className="flex items-center justify-between">
        <label 
          htmlFor={name}
          className="text-[10px] uppercase tracking-[0.25em] text-muted font-semibold"
        >
          {label}
        </label>
        
        <AnimatePresence mode="wait">
          {status !== "empty" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5"
            >
              {getStatusIcon()}
              <span className={`text-[10px] ${
                status === "auto-filled" ? "text-gold" :
                status === "verified" ? "text-success" :
                status === "error" ? "text-danger" :
                "text-muted"
              }`}>
                {getStatusLabel()}
              </span>
              
              {/* Bouton de vérification pour auto-filled */}
              {status === "auto-filled" && onVerify && (
                <button
                  type="button"
                  onClick={onVerify}
                  className="text-[10px] text-white/40 hover:text-white underline ml-2"
                >
                  Confirmer
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Champ avec bordure dynamique */}
      <motion.div
        className={`relative rounded-xl border transition-all duration-200 ${getStatusStyles()}`}
        whileTap={{ scale: 0.995 }}
      >
        {children}

        {/* Glow effect sur focus */}
        <div className="absolute inset-0 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute inset-0 rounded-xl bg-gold/5 blur-md" />
        </div>
      </motion.div>

      {/* Hint ou confidence */}
      <AnimatePresence>
        {(hint || (confidence && status === "auto-filled")) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-muted/70"
          >
            {hint || `Confiance: ${confidence}%`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
