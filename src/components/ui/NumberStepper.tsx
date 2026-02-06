"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface NumberStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    className?: string;
}

export function NumberStepper({
    value,
    onChange,
    min = 0,
    max = 1000,
    step = 1,
    suffix,
    className = ""
}: NumberStepperProps) {
    // Local state for smooth typing before validation
    const [localValue, setLocalValue] = useState<string>(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleIncrement = () => {
        const newValue = Math.min(value + step, max);
        onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(value - step, min);
        onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);

        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
            // Only update parent if valid, but don't clamp strictly while typing
            // to allow deleting digits. We clamp on blur.
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        let parsed = parseFloat(localValue);
        if (isNaN(parsed)) parsed = min;
        const clamped = Math.max(min, Math.min(max, parsed));
        setLocalValue(clamped.toString());
        onChange(clamped);
    };

    return (
        <div className={`flex items-center bg-surface border border-boundary rounded-lg overflow-hidden h-full ${className}`}>
            <button
                type="button"
                onClick={handleDecrement}
                disabled={value <= min}
                className="w-10 h-full flex items-center justify-center text-muted hover:text-primary-400 hover:bg-primary-900/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95"
                aria-label="Diminuer"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>

            <div className="flex items-center justify-center px-1 min-w-[60px] h-full border-x border-boundary/50 bg-surface-highlight/50">
                <input
                    type="number"
                    value={localValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full text-center bg-transparent border-none outline-none text-main font-bold p-0 text-sm appearance-none focus:ring-0"
                    style={{ MozAppearance: "textfield" }}
                />
                {suffix && (
                    <span className="text-[10px] text-muted font-medium ml-1 select-none pt-0.5">
                        {suffix}
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={handleIncrement}
                disabled={value >= max}
                className="w-10 h-full flex items-center justify-center text-muted hover:text-primary-400 hover:bg-primary-900/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95"
                aria-label="Augmenter"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>
    );
}
