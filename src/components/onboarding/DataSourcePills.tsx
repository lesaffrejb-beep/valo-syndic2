/**
 * DATA SOURCE PILLS — Indicateurs de sources de données
 * ======================================================
 * Affiche les sources d'enrichissement trouvées sous forme de pills.
 * 
 * @author JB
 * @date 2026-02-03
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  Database, 
  Loader2,
  CheckCircle2 
} from "lucide-react";
import { type EnrichmentSources } from "@/hooks/useSmartForm";

interface DataSourcePillsProps {
  sources: EnrichmentSources;
  isLoading?: boolean;
  className?: string;
}

export function DataSourcePills({ 
  sources, 
  isLoading = false,
  className = "" 
}: DataSourcePillsProps) {
  const hasAnySource = sources.dpe || sources.cadastre || sources.marketData || sources.coordinates;

  if (!hasAnySource && !isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
          >
            <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
            <span className="text-xs text-muted">Enrichissement...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DPE Source */}
      <AnimatePresence>
        {sources.dpe && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30"
          >
            <Zap className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-medium text-gold">DPE {sources.dpe.dpe}</span>
            <CheckCircle2 className="w-3 h-3 text-gold/70" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cadastre Source */}
      <AnimatePresence>
        {sources.cadastre && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Cadastre {sources.cadastre.section}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Data Source */}
      <AnimatePresence>
        {sources.marketData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30"
          >
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-medium text-success">
              DVF {sources.marketData.averagePricePerSqm.toLocaleString()}€/m²
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coordinates Source */}
      <AnimatePresence>
        {sources.coordinates && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/20"
          >
            <Database className="w-3.5 h-3.5 text-muted" />
            <span className="text-xs text-muted">GPS</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
