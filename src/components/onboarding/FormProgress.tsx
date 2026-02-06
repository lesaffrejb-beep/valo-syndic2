/**
 * FORM PROGRESS — Jauge de progression du formulaire
 * ===================================================
 * Visualise l'avancement de complétion avec animation fluide.
 * 
 * @author JB
 * @date 2026-02-03
 */

"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

interface FormProgressProps {
  progress: number; // 0-100
  state: string;
  className?: string;
}

export function FormProgress({ progress, state, className = "" }: FormProgressProps) {
  const getStatusText = () => {
    switch (state) {
      case "IDLE":
        return "Commencez par l'adresse";
      case "TYPING":
      case "SEARCHING":
        return "Recherche en cours...";
      case "SELECTED":
      case "ENRICHING":
        return "Enrichissement des données...";
      case "READY":
        if (progress < 100) return "Vérifiez et complétez";
        return "Prêt à lancer l'analyse";
      case "SUBMITTING":
        return "Calcul en cours...";
      case "ERROR":
        return "Vérifiez les informations";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    if (state === "ERROR") return "bg-danger";
    if (progress >= 100) return "bg-success";
    if (progress >= 60) return "bg-gold";
    return "bg-primary";
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-muted">
          Progression
        </span>
        <span className="text-xs font-medium text-white flex items-center gap-2">
          {state === "ENRICHING" || state === "SUBMITTING" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : progress >= 100 ? (
            <Check className="w-3 h-3 text-success" />
          ) : null}
          {progress}%
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getStatusColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0, 0.2, 1] 
          }}
        />
      </div>

      {/* Texte de statut */}
      <motion.p
        key={state + progress}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-muted mt-2 text-center"
      >
        {getStatusText()}
      </motion.p>
    </div>
  );
}
