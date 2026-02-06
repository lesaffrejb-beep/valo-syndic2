/**
 * VALO-SYNDIC — Centralized Animations
 * ====================================
 * Constantes et variants Framer Motion réutilisables.
 */

import { type Variants } from "framer-motion";

export const DEFAULT_TRANSITION = {
    duration: 0.5,
    ease: "easeOut" as const,
};

export const SPRING_TRANSITION = {
    type: "spring",
    stiffness: 300,
    damping: 30,
};

export const FADE_IN_VARIANTS: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: DEFAULT_TRANSITION
    },
};

export const STAGGER_CONTAINER_VARIANTS: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const CARD_HOVER_VARIANTS: Variants = {
    hover: {
        y: -5,
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)"
    },
};
