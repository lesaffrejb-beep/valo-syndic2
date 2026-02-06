/**
 * ArgumentairePanel — Module de Persuasion Intelligente
 * ======================================================
 * Arguments commerciaux et juridiques pour convaincre.
 * Wording "Commercial & Juridique" calibré.
 */

"use client";

import { type DiagnosticResult } from "@/lib/schemas";
import { formatCurrency } from "@/lib/calculator";

interface ArgumentairePanelProps {
    result: DiagnosticResult;
}

// AI DECISION: Arguments pré-calibrés pour MVP
// En V2, ces arguments seront générés dynamiquement par le module AI
const LEGAL_ARGUMENTS = {
    G: [
        "⚖️ Article L. 173-2 du Code de la construction : Interdiction de location en vigueur depuis le 1er janvier 2025.",
        "📉 Maintenir le bien en l'état expose les bailleurs à une impossibilité légale de relouer.",
        "💸 Risque de contentieux locatif en cas de renouvellement de bail non conforme.",
    ],
    F: [
        "⚖️ Loi Climat & Résilience : Interdiction de location au 1er janvier 2028 (dans moins de 2 ans).",
        "📋 Les diagnostiqueurs anticipent déjà cette échéance dans leurs rapports.",
        "🏦 Les banques intègrent le DPE dans leurs critères d'octroi de prêt.",
    ],
    E: [
        "⚖️ Horizon 2034 : Votre bien sera impacté dans moins de 8 ans.",
        "📈 Anticiper permet de bénéficier des aides au plus haut historique.",
        "🔮 Les taux d'aide ont déjà baissé de 5% entre 2024 et 2025 — la tendance continue.",
    ],
    DEFAULT: [
        "✅ Votre bien est conforme aux obligations actuelles.",
        "📈 Une rénovation améliorerait sa valeur locative et patrimoniale.",
        "💡 Les aides restent accessibles pour optimiser votre investissement.",
    ],
};

const COMMERCIAL_ARGUMENTS = {
    inaction: (cost: number) => [
        {
            icon: "🔥",
            title: "L'inflation travaille contre vous",
            text: `Chaque année d'attente ajoute +4.5% au coût des travaux. Sur 3 ans, vous perdez ${formatCurrency(cost)}.`,
        },
        {
            icon: "📉",
            title: "La décote passoire",
            text: "Les biens F/G se vendent 12% moins cher que leurs équivalents rénovés en zone tendue.",
        },
        {
            icon: "⏰",
            title: "Le moment optimal",
            text: "MaPrimeRénov' Copropriété est à son maximum historique. Les taux baissent chaque année.",
        },
    ],
    action: [
        {
            icon: "💰",
            title: "Jusqu'à 55% de subvention",
            text: "MaPrimeRénov' Copropriété + Bonus Sortie Passoire couvrent plus de la moitié du projet.",
        },
        {
            icon: "🏦",
            title: "Éco-PTZ collectif",
            text: "50 000€ par logement à taux 0% sur 20 ans. Soit un autofinancement quasi-total des travaux.",
        },
        {
            icon: "📈",
            title: "Valeur verte +12%",
            text: "Un bien rénové prend 12% de valeur en moyenne. L'investissement se rembourse à la revente.",
        },
    ],
};

export function ArgumentairePanel({ result }: ArgumentairePanelProps) {
    const { currentDPE } = result.input;
    const legalArgs =
        LEGAL_ARGUMENTS[currentDPE as keyof typeof LEGAL_ARGUMENTS] ||
        LEGAL_ARGUMENTS.DEFAULT;
    const commercialArgs = COMMERCIAL_ARGUMENTS.inaction(result.inactionCost.totalInactionCost);
    const actionArgs = COMMERCIAL_ARGUMENTS.action;

    const isPassoire = currentDPE === "F" || currentDPE === "G";

    return (
        <div className="card overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-4 border-b border-boundary">
                <h3 className="text-lg font-semibold text-main flex items-center gap-2">
                    📋 Argumentaire AG — Éléments de Langage
                </h3>
                <p className="text-sm text-muted mt-1">
                    Points clés pour convaincre votre Assemblée Générale
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Section Juridique */}
                <div>
                    <h4 className="text-sm font-semibold text-danger-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-danger-500 rounded-full"></span>
                        Fondements Juridiques
                    </h4>
                    <div className="space-y-2">
                        {legalArgs.map((arg, i) => (
                            <div
                                key={i}
                                className="p-3 bg-surface rounded-xl text-sm text-main border-l-4 border-danger-500"
                            >
                                {arg}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section Coût Inaction */}
                <div>
                    <h4 className="text-sm font-semibold text-warning-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                        Coût de l&apos;Inaction
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {commercialArgs.map((arg, i) => (
                            <div
                                key={i}
                                className="p-4 bg-warning/10 rounded-xl border border-warning/20 hover:bg-warning/20 transition-colors"
                            >
                                <div className="text-2xl mb-2">{arg.icon}</div>
                                <h5 className="font-semibold text-main text-sm mb-1">{arg.title}</h5>
                                <p className="text-xs text-muted">{arg.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section Bénéfices */}
                <div>
                    <h4 className="text-sm font-semibold text-success-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                        Bénéfices de l&apos;Action
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {actionArgs.map((arg, i) => (
                            <div
                                key={i}
                                className="p-4 bg-success/10 rounded-xl border border-success/20 hover:bg-success/20 transition-colors"
                            >
                                <div className="text-2xl mb-2">{arg.icon}</div>
                                <h5 className="font-semibold text-main text-sm mb-1">{arg.title}</h5>
                                <p className="text-xs text-muted">{arg.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                {isPassoire && (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl border border-primary/30">
                        <p className="text-sm text-primary-200 font-medium">
                            💡 <span className="font-bold text-primary">Phrase clé pour l&apos;AG :</span> &quot;En votant cette
                            résolution aujourd&apos;hui, vous sécurisez la valeur locative de vos biens et
                            bénéficiez d&apos;aides qui ne seront plus disponibles demain.&quot;
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
