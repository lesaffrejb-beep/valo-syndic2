/**
 * UrgencyScore — Indicateur d'Urgence Visuel
 * ==========================================
 * Score de 0 à 100 avec jauge circulaire.
 * Design néo-banque avec code couleur dynamique.
 */

"use client";

import { useEffect, useState } from "react";
import { type ComplianceStatus } from "@/lib/schemas";
import { type DPELetter } from "@/lib/constants";
import { ParticleEmitter } from "@/components/ui/ParticleEmitter";

interface UrgencyScoreProps {
    compliance: ComplianceStatus;
    currentDPE: DPELetter;
}

// Calcul du score d'urgence (0-100)
function calculateUrgencyScore(compliance: ComplianceStatus, dpe: DPELetter): number {
    // DPE G déjà interdit = 100
    if (compliance.isProhibited) return 100;

    // DPE A-D sans interdiction = score bas
    if (!compliance.prohibitionDate) {
        const scores: Record<string, number> = { D: 20, C: 10, B: 5, A: 0 };
        return scores[dpe] || 15;
    }

    // Score basé sur le temps restant
    const days = compliance.daysUntilProhibition || 0;
    if (days <= 0) return 100;
    if (days <= 365) return 95; // < 1 an
    if (days <= 730) return 85; // < 2 ans
    if (days <= 1095) return 70; // < 3 ans
    if (days <= 1825) return 55; // < 5 ans
    return 40;
}

// Couleur selon le score
function getScoreColor(score: number): { bg: string; text: string; stroke: string } {
    if (score >= 80) return { bg: "bg-danger/10", text: "text-danger-500", stroke: "#EF4444" };
    if (score >= 60) return { bg: "bg-warning/10", text: "text-warning-500", stroke: "#F59E0B" };
    if (score >= 40) return { bg: "bg-warning/10", text: "text-warning-500", stroke: "#F59E0B" };
    return { bg: "bg-success/10", text: "text-success-500", stroke: "#10B981" };
}

// Message selon le score
function getScoreMessage(score: number): { title: string; subtitle: string } {
    if (score >= 90) return { title: "CRITIQUE", subtitle: "Action immédiate requise" };
    if (score >= 70) return { title: "URGENT", subtitle: "Délai de réaction court" };
    if (score >= 50) return { title: "ATTENTION", subtitle: "Anticipation recommandée" };
    if (score >= 30) return { title: "MODÉRÉ", subtitle: "Planification conseillée" };
    return { title: "SEREIN", subtitle: "Bien conforme" };
}

export function UrgencyScore({ compliance, currentDPE }: UrgencyScoreProps) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const score = calculateUrgencyScore(compliance, currentDPE);
    const colors = getScoreColor(score);
    const message = getScoreMessage(score);

    // Animation du score
    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const increment = score / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setAnimatedScore(score);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.round(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [score]);

    // Calcul du cercle SVG (scaled x1.5 for better visibility)
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className={`card-bento ${colors.bg} rounded-3xl p-6 relative transition-colors duration-300 h-full flex flex-col group hover:border-white/10 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]`}>
            {/* Particle System for Critical Scores */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl">
                <ParticleEmitter active={score >= 80} color={colors.stroke} />
            </div>

            {/* Glow based on score */}
            <div className={`absolute inset-0 bg-${colors.stroke}/5 pointer-events-none rounded-3xl`} />

            {/* HEADER STANDARD */}
            <div className="relative z-10 mb-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    🎯 Score d&apos;urgence
                </h3>
            </div>

            {/* BODY CENTERED */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full py-2">

                {/* Visual + Message Wrapper */}

                <div className="flex flex-col items-center gap-6">
                    {/* Cercle SVG - Clean transparent container */}
                    <div className="relative flex-shrink-0 bg-transparent">
                        <svg width="180" height="180" className="transform -rotate-90 block bg-transparent" style={{ overflow: 'visible' }}>
                            {/* Background circle */}
                            <circle
                                cx="90"
                                cy="90"
                                r={radius}
                                fill="none"
                                stroke="currentColor"
                                strokeOpacity="0.1"
                                strokeWidth="12"
                                className="text-boundary"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="90"
                                cy="90"
                                r={radius}
                                fill="none"
                                stroke={colors.stroke}
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                className="transition-all duration-1000 ease-out"
                                style={{ filter: `drop-shadow(0 0 12px ${colors.stroke})` }}
                            />
                        </svg>
                        {/* Score au centre */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-4xl font-black ${colors.text} tabular-nums`}>
                                {animatedScore}
                            </span>
                        </div>
                    </div>

                    {/* Message Below or Aside? User said "Chart container [...] so it blends". 
                        Let's keep the message below for a clean vertical center look as customary in score cards,
                        or per request "Body (flex-1, center content)". 
                        The previous layout was row. Let's check space. 
                        If we stand in a grid-cols-2 row with RisksCard, we have horizontal space.
                        Let's try to keep the Row layout inside the Body if space permits, or Stack if better.
                        The user complaint was "The title ... is floating inside the content area".
                        Let's stick to a clean centered column layout for the body content to emphasize the Gauge, 
                        OR a compact row if it fits better.
                        Given the "Vertical centering" request, a Column stack of (Gauge + Text) is safest for alignment.
                    */}
                    <div className="text-center">
                        <p className={`text-2xl font-bold ${colors.text} mb-1`}>{message.title}</p>
                        <p className="text-sm text-muted">{message.subtitle}</p>

                        {compliance.daysUntilProhibition != null && compliance.daysUntilProhibition > 0 && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-surface/80 rounded-lg border border-boundary/50 backdrop-blur-sm">
                                <span className="text-xs text-muted">Temps restant:</span>
                                <span className="text-sm font-bold text-main tabular-nums">
                                    {Math.floor(compliance.daysUntilProhibition / 30)} mois
                                </span>
                            </div>
                        )}

                        {compliance.isProhibited && (
                            <div className="mt-4 px-3 py-1.5 bg-danger/20 rounded-lg border border-danger/30 inline-block">
                                <span className="text-xs text-danger-500 font-bold uppercase tracking-wide">
                                    🚫 Interdiction en cours
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
