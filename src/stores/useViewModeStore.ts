/**
 * useViewModeStore — State for "Immeuble" vs "Ma Poche" view toggle
 * Manages the psychological switch between global copro and individual view.
 */

import { create } from 'zustand';

export type ViewMode = 'immeuble' | 'maPoche';

interface ViewModeState {
    viewMode: ViewMode;
    userTantiemes: number; // User's tantièmes (e.g., 100/1000)
    setViewMode: (mode: ViewMode) => void;
    setUserTantiemes: (tantiemes: number) => void;
    /** Helper to calculate a value adjusted for "Ma Poche" mode */
    getAdjustedValue: (globalValue: number) => number;
}

export const useViewModeStore = create<ViewModeState>((set, get) => ({
    viewMode: 'immeuble',
    userTantiemes: 100, // Default: 100/1000 (10%)

    setViewMode: (mode) => set({ viewMode: mode }),

    setUserTantiemes: (tantiemes) => set(() => {
        const clamped = Math.max(1, Math.min(1000, tantiemes));
        const nextMode: ViewMode = clamped >= 995 ? 'immeuble' : 'maPoche';
        return { userTantiemes: clamped, viewMode: nextMode };
    }),

    getAdjustedValue: (globalValue) => {
        const { viewMode, userTantiemes } = get();
        if (viewMode === 'immeuble' && userTantiemes >= 995) {
            return globalValue;
        }
        // "Ma Poche" mode (or any partial quote-part): calculate individual share
        return (globalValue * userTantiemes) / 1000;
    },
}));
