"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeEuro, TrendingUp, CalendarClock, ChevronDown, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ObjectionHandlerProps {
    className?: string;
}

interface Objection {
    id: string;
    Icon: React.ElementType;
    title: string;
    subtitle: string;
    arguments: {
        heading: string;
        content: string;
    }[];
    color: "danger" | "warning" | "info";
}

const OBJECTIONS: Objection[] = [
    {
        id: "too-expensive",
        Icon: BadgeEuro,
        title: "C'est trop cher !",
        subtitle: "L'objection n°1",
        color: "danger",
        arguments: [
            {
                heading: "L'Éco-PTZ à 0%",
                content: "Le prêt collectif à taux zéro permet d'étaler le coût sur 20 ans. Votre mensualité peut être inférieure à 100€/mois.",
            },
            {
                heading: "MaPrimeRénov' couvre 30-45%",
                content: "L'État prend en charge jusqu'à 45% du coût des travaux. Avec le bonus sortie passoire (+10%), ce sont 55% d'aides potentielles.",
            },
            {
                heading: "Le coût de l'inaction",
                content: "Attendre 3 ans = +15% d'inflation travaux BTP. Attendre la sanction = interdiction de louer et chute de la valeur vénale.",
            },
        ],
    },
    {
        id: "too-old",
        Icon: TrendingUp,
        title: "Rentabilité & Âge",
        subtitle: "L'objection patrimoniale",
        color: "warning",
        arguments: [
            {
                heading: "Valeur locative immédiate",
                content: "Sans travaux, votre bien sera interdit à la location dès 2028 (DPE F). La valorisation est immédiate, pas dans 20 ans.",
            },
            {
                heading: "Transmission du patrimoine",
                content: "Léguer une passoire thermique = léguer une dette. Un bien rénové se vend 10-15% plus cher (valeur verte).",
            },
            {
                heading: "Confort immédiat",
                content: "Isolation = moins de courants d'air, factures divisées, confort thermique été comme hiver.",
            },
        ],
    },
    {
        id: "wait-later",
        Icon: CalendarClock,
        title: "On verra plus tard...",
        subtitle: "La procrastination fatale",
        color: "info",
        arguments: [
            {
                heading: "Inflation BTP : 4,5%/an",
                content: "Chaque année d'attente augmente le coût des travaux de 4,5%. Sur 3 ans, c'est +14% sur le devis final.",
            },
            {
                heading: "Calendrier législatif",
                content: "Les dates d'interdiction (G:2025, F:2028, E:2034) sont fermes. Le DPE collectif devient opposable.",
            },
            {
                heading: "Course aux artisans",
                content: "Tous les immeubles devront rénover. Attendre = subir des délais de 18-24 mois et des tarifs gonflés.",
            },
        ],
    },
];

export function ObjectionHandler({ className = "" }: ObjectionHandlerProps) {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <Card variant="glass" className={cn("p-6 md:p-8 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]", className)}>
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-xl">💬</span> Réponses aux Objections
                </h3>
            </div>

            <div className="space-y-4">
                {OBJECTIONS.map((objection) => {
                    const isOpen = openId === objection.id;
                    const Icon = objection.Icon;

                    // Colors
                    const colorMap = {
                        danger: "text-danger border-danger/20 bg-danger/5 hover:bg-danger/10",
                        warning: "text-warning border-warning/20 bg-warning/5 hover:bg-warning/10",
                        info: "text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                    };
                    const activeColorClass = colorMap[objection.color];

                    return (
                        <div
                            key={objection.id}
                            className={cn(
                                "rounded-xl border overflow-hidden transition-all duration-300",
                                isOpen ? "bg-white/[0.04] border-white/10" : "bg-transparent border-white/5"
                            )}
                        >
                            <button
                                onClick={() => toggle(objection.id)}
                                className={cn(
                                    "w-full px-5 py-4 flex items-center justify-between text-left transition-all",
                                    !isOpen && "hover:bg-white/[0.02]"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-colors", activeColorClass)}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm md:text-base">{objection.title}</p>
                                        <p className="text-xs text-muted">{objection.subtitle}</p>
                                    </div>
                                </div>
                                <ChevronDown
                                    className={cn("w-5 h-5 text-muted transition-transform duration-300", isOpen && "rotate-180 text-white")}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        key={`content-${objection.id}`}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-0 space-y-4">
                                            <div className="h-px bg-white/5 w-full mb-4" />
                                            {objection.arguments.map((arg, idx) => (
                                                <div key={idx} className="pl-4 border-l-2 border-white/10 hover:border-gold/30 transition-colors">
                                                    <p className="font-bold text-white text-xs uppercase tracking-wide mb-1">{arg.heading}</p>
                                                    <p className="text-sm text-muted leading-relaxed">{arg.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 opacity-50">
                <AlertTriangle className="w-3 h-3 text-warning" />
                <p className="text-[10px] text-muted uppercase tracking-wider">
                    Idéal pour projection en Assemblée Générale
                </p>
            </div>
        </Card>
    );
}
