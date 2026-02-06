"use client";

import { motion } from "framer-motion";
import type { EnrichmentSource } from "@/lib/api";

interface DataSourceBadgeProps {
    /** Sources d'enrichissement */
    sources: EnrichmentSource[];
    /** Afficher en version compacte */
    compact?: boolean;
    /** Classe CSS additionnelle */
    className?: string;
}

/**
 * Badge affichant les sources de données utilisées
 *
 * Objectif : Montrer d'où viennent les données de manière transparente
 * mais élégante. L'utilisateur comprend que l'outil a fait des recherches
 * automatiques pour lui.
 *
 * Exemple :
 * "Données enrichies via API Adresse, DVF, Cadastre"
 */
export function DataSourceBadge({
    sources,
    compact = false,
    className = "",
}: DataSourceBadgeProps) {
    if (sources.length === 0) {
        return null;
    }

    const successSources = sources.filter((s) => s.status === "success");
    const partialSources = sources.filter((s) => s.status === "partial");

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`inline-flex items-center gap-1.5 px-2 py-1 bg-success/10 border border-success/20 rounded-full ${className}`}
            >
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-[10px] text-success font-medium">
                    {successSources.length} source{successSources.length > 1 ? "s" : ""} enrichie{successSources.length > 1 ? "s" : ""}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 bg-surface-hover/50 border border-boundary rounded-xl ${className}`}
        >
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✨</span>
                <h4 className="text-sm font-medium text-main">
                    Données enrichies automatiquement
                </h4>
            </div>

            <div className="space-y-2">
                {sources.map((source, index) => (
                    <SourceRow key={source.name + index} source={source} />
                ))}
            </div>

            <p className="mt-3 text-[10px] text-subtle">
                Ces données proviennent de sources officielles et sont mises à jour en temps réel.
            </p>
        </motion.div>
    );
}

function SourceRow({ source }: { source: EnrichmentSource }) {
    const statusIcon = source.status === "success" ? "✅" :
        source.status === "partial" ? "⚠️" : "❌";

    const statusColor = source.status === "success" ? "text-success" :
        source.status === "partial" ? "text-warning" : "text-danger";

    return (
        <div className="flex items-start gap-3 text-sm">
            <span className="mt-0.5">{statusIcon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-main hover:text-primary transition-colors"
                    >
                        {source.name}
                    </a>
                    <span className={`text-xs ${statusColor}`}>
                        {source.status === "success" && "OK"}
                        {source.status === "partial" && "Partiel"}
                        {source.status === "error" && "Erreur"}
                    </span>
                </div>
                {source.dataPoints.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">
                        {source.dataPoints.join(" • ")}
                    </p>
                )}
            </div>
            <span className="text-[10px] text-subtle whitespace-nowrap">
                {formatTime(source.fetchedAt)}
            </span>
        </div>
    );
}

function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
        return "À l'instant";
    }
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `Il y a ${mins} min`;
    }
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Carte compacte affichant une donnée enrichie avec sa source
 */
interface EnrichedDataCardProps {
    /** Icône ou emoji */
    icon: string;
    /** Titre de la donnée */
    title: string;
    /** Valeur principale */
    value: string | number;
    /** Unité (optionnel) */
    unit?: string;
    /** Source de la donnée */
    source: EnrichmentSource;
    /** Description additionnelle */
    description?: string;
    /** Classe CSS additionnelle */
    className?: string;
}

export function EnrichedDataCard({
    icon,
    title,
    value,
    unit,
    source,
    description,
    className = "",
}: EnrichedDataCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 bg-surface border border-boundary rounded-xl ${className}`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="text-xs text-muted uppercase tracking-wide">{title}</span>
                </div>
                <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline"
                    title={`Source: ${source.name}`}
                >
                    {source.name.split(" ")[0]}
                </a>
            </div>

            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-main">
                    {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
                </span>
                {unit && <span className="text-sm text-muted">{unit}</span>}
            </div>

            {description && (
                <p className="mt-2 text-xs text-muted">{description}</p>
            )}
        </motion.div>
    );
}

/**
 * Bandeau d'enrichissement en cours
 */
interface EnrichmentProgressProps {
    isEnriching: boolean;
    currentStep?: string;
}

export function EnrichmentProgress({ isEnriching, currentStep }: EnrichmentProgressProps) {
    if (!isEnriching) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl"
        >
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div>
                <p className="text-sm font-medium text-primary">
                    Enrichissement en cours...
                </p>
                {currentStep && (
                    <p className="text-xs text-primary/70">{currentStep}</p>
                )}
            </div>
        </motion.div>
    );
}
