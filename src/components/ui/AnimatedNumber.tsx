/**
 * AnimatedNumber — Le "Money Counter" 
 * Fait défiler les chiffres de 0 → valeur finale
 * Effet psychologique : donne l'impression de calcul en temps réel
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatFn?: (value: number) => string;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export function AnimatedNumber({
    value,
    duration = 1.5,
    formatFn,
    className = "",
    prefix = "",
    suffix = "",
}: AnimatedNumberProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [hasAnimated, setHasAnimated] = useState(false);

    // Spring animation pour le compteur
    const springValue = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    // Transformer la valeur spring en valeur affichée
    const displayValue = useTransform(springValue, (latest) => {
        const formatted = formatFn
            ? formatFn(Math.round(latest))
            : Math.round(latest).toLocaleString("fr-FR");
        return `${prefix}${formatted}${suffix}`;
    });

    const [currentDisplay, setCurrentDisplay] = useState(`${prefix}0${suffix}`);

    useEffect(() => {
        if (isInView && !hasAnimated) {
            springValue.set(value);
            setHasAnimated(true);
        }
    }, [isInView, value, springValue, hasAnimated]);

    useEffect(() => {
        const unsubscribe = displayValue.on("change", (v) => {
            setCurrentDisplay(v);
        });
        return unsubscribe;
    }, [displayValue]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3 }}
        >
            {currentDisplay}
        </motion.span>
    );
}

/**
 * AnimatedCurrency — Variante spécialisée pour les montants en euros
 */
interface AnimatedCurrencyProps {
    value: number;
    duration?: number;
    className?: string;
    showCents?: boolean;
}

export function AnimatedCurrency({
    value,
    duration = 1.5,
    className = "",
    showCents = false,
}: AnimatedCurrencyProps) {
    const formatCurrency = (val: number) => {
        const useDecimals = Math.abs(val) < 1000 && val !== 0 || showCents;

        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: useDecimals ? 2 : 0,
            maximumFractionDigits: useDecimals ? 2 : 0,
        }).format(val);
    };

    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            formatFn={formatCurrency}
            className={className}
        />
    );
}

/**
 * AnimatedPercent — Pour les pourcentages animés
 */
interface AnimatedPercentProps {
    value: number;
    duration?: number;
    className?: string;
    decimals?: number;
}

export function AnimatedPercent({
    value,
    duration = 1.2,
    className = "",
    decimals = 0,
}: AnimatedPercentProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [hasAnimated, setHasAnimated] = useState(false);

    const springValue = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const [currentValue, setCurrentValue] = useState(0);

    useEffect(() => {
        if (isInView && !hasAnimated) {
            springValue.set(value);
            setHasAnimated(true);
        }
    }, [isInView, value, springValue, hasAnimated]);

    useEffect(() => {
        const unsubscribe = springValue.on("change", (v) => {
            setCurrentValue(v);
        });
        return unsubscribe;
    }, [springValue]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
        >
            {currentValue.toFixed(decimals)}%
        </motion.span>
    );
}
