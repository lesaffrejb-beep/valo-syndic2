/**
 * AnimatedCard — Wrapper carte avec animations hover/tap et entrée fluide
 * Pour donner du "juice" aux cartes du dashboard
 */

"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";
import { DEFAULT_TRANSITION } from "@/lib/animations";

interface AnimatedCardProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    interactive?: boolean;
}

const cardVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: DEFAULT_TRANSITION,
    },
};

export function AnimatedCard({
    children,
    delay = 0,
    className = "",
    interactive = true,
}: AnimatedCardProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ delay }}
            {...(interactive ? {
                whileHover: {
                    scale: 1.01,
                    y: -2,
                    transition: { duration: 0.2 }
                }
            } : {})}
            className={`${className} ${interactive ? "cursor-default" : ""}`}
        >
            {children}
        </motion.div>
    );
}

/**
 * AnimatedButton — Bouton avec micro-interactions
 */
interface AnimatedButtonProps {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit";
}

export function AnimatedButton({
    children,
    onClick,
    disabled = false,
    className = "",
    type = "button",
}: AnimatedButtonProps) {
    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            {...(!disabled ? {
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.97 }
            } : {})}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={className}
        >
            {children}
        </motion.button>
    );
}

/**
 * StaggerContainer — Container pour animations en cascade
 */
interface StaggerContainerProps {
    children: ReactNode;
    staggerDelay?: number;
    className?: string;
}

const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

export function StaggerContainer({ children, staggerDelay = 0.1, className = "" }: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 1 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: 0.1,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <motion.div variants={itemVariants} className={className}>
            {children}
        </motion.div>
    );
}
