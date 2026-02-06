/**
 * BenchmarkBadge — Market Watchdog Visual Indicator
 * ==================================================
 * Displays a color-coded badge indicating cost positioning vs market.
 */

"use client";

import { type BenchmarkStatus } from "@/lib/services/marketBenchmarkService";

interface BenchmarkBadgeProps {
    status: BenchmarkStatus;
    label: string;
    className?: string;
}

const statusConfig: Record<BenchmarkStatus, { bg: string; text: string; icon: string; border: string }> = {
    green: {
        bg: "bg-success-900/30",
        text: "text-success-400",
        border: "border-success-500/30",
        icon: "✓",
    },
    yellow: {
        bg: "bg-warning-900/30",
        text: "text-warning-400",
        border: "border-warning-500/30",
        icon: "⚠",
    },
    red: {
        bg: "bg-danger-900/30",
        text: "text-danger-400",
        border: "border-danger-500/30",
        icon: "⬆",
    },
};

export function BenchmarkBadge({ status, label, className = "" }: BenchmarkBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={`
                inline-flex items-center gap-1.5 
                px-2.5 py-1 
                text-xs font-medium 
                rounded-full 
                border
                ${config.bg} 
                ${config.text} 
                ${config.border}
                ${className}
            `}
            title="Comparaison avec la médiane régionale Angers/49"
        >
            <span className="text-[10px]">{config.icon}</span>
            {label}
        </span>
    );
}
