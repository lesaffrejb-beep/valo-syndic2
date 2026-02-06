"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Type-safe window interface for Safari compatibility
interface WindowWithWebkit {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
    _valoAudioCtx?: AudioContext;
}

interface SoundState {
    isMuted: boolean;
    toggleMute: () => void;
    playSound: (type: "click" | "success" | "hover" | "switch") => void;
}

export const useSoundEffects = create<SoundState>()(
    persist(
        (set, get) => ({
            isMuted: true, // Muted by default for UX
            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
            playSound: (type) => {
                const { isMuted } = get();
                if (isMuted) return;

                if (typeof window === "undefined") return;

                const win = window as WindowWithWebkit;
                const AudioContextClass = win.AudioContext || win.webkitAudioContext;
                if (!AudioContextClass) return;

                // Singleton Pattern to prevent memory leaks
                if (!win._valoAudioCtx) {
                    win._valoAudioCtx = new AudioContextClass();
                }
                const ctx = win._valoAudioCtx;

                // Resume if suspended (browser policy)
                if (ctx.state === "suspended") {
                    ctx.resume();
                }

                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                const now = ctx.currentTime;

                switch (type) {
                    case "click":
                        // Crisp mechanical click
                        oscillator.type = "sine";
                        oscillator.frequency.setValueAtTime(800, now);
                        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                        gainNode.gain.setValueAtTime(0.05, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                        oscillator.start(now);
                        oscillator.stop(now + 0.05);
                        break;

                    case "hover":
                        // Very subtle high frequency blip
                        oscillator.type = "sine";
                        oscillator.frequency.setValueAtTime(1200, now);
                        oscillator.frequency.linearRampToValueAtTime(1250, now + 0.02);
                        gainNode.gain.setValueAtTime(0.02, now);
                        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.02);
                        oscillator.start(now);
                        oscillator.stop(now + 0.02);
                        break;

                    case "switch":
                        // Toggle sound
                        oscillator.type = "triangle";
                        oscillator.frequency.setValueAtTime(600, now);
                        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                        gainNode.gain.setValueAtTime(0.03, now);
                        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
                        oscillator.start(now);
                        oscillator.stop(now + 0.1);
                        break;

                    case "success":
                        // Positive chime
                        const osc2 = ctx.createOscillator();
                        osc2.connect(gainNode);

                        oscillator.type = "sine";
                        oscillator.frequency.setValueAtTime(500, now);
                        oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.3);

                        osc2.type = "triangle";
                        osc2.frequency.setValueAtTime(750, now);
                        osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.3);

                        gainNode.gain.setValueAtTime(0.05, now);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                        oscillator.start(now);
                        oscillator.stop(now + 0.5);
                        osc2.start(now);
                        osc2.stop(now + 0.5);
                        break;
                }
            },
        }),
        {
            name: "valo-syndic-sound-mode",
        }
    )
);
