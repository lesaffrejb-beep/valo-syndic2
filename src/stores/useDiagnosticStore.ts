/**
 * VALO-SYNDIC — Diagnostic Store (Zustand v5)
 * ============================================
 * Central state management for the diagnostic form.
 * Wraps the pure calculator from src/lib/calculator.ts.
 */

import { create } from "zustand";
import type { DiagnosticInput, DiagnosticResult } from "@/lib/schemas";
import { generateDiagnostic } from "@/lib/calculator";
import { VALUATION_PARAMS } from "@/lib/constants";

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_INPUT: Partial<DiagnosticInput> = {
    averagePricePerSqm: 3200,
    currentDPE: "F",
    targetDPE: "C",
    numberOfUnits: 20,
    commercialLots: 0,
    estimatedCostHT: 0,         // 0 → auto-estimated as surface × 850
    localAidAmount: 0,
    alurFund: 0,
    ceeBonus: 0,
    currentEnergyBill: 0,
    investorRatio: 0,
    isCostTTC: true,
    includeHonoraires: true,
};

// ─── Store Shape ─────────────────────────────────────────────────────────────
interface DiagnosticState {
    /** Partial input — progressively filled by the user */
    input: Partial<DiagnosticInput>;
    /** Calculator output — null until first run */
    result: DiagnosticResult | null;
    /** Loading flag for async UX feedback */
    isCalculating: boolean;
    /** View mode toggle: pilotage (cockpit) vs presentation (projector) */
    viewMode: "pilotage" | "presentation";
    /** Merge a partial patch into the current input */
    updateInput: (patch: Partial<DiagnosticInput>) => void;
    /** Reset input to defaults */
    resetInput: () => void;
    /** Run the diagnostic engine with the current input */
    runDiagnostic: () => Promise<void>;
    /** Toggle view mode */
    setViewMode: (mode: "pilotage" | "presentation") => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useDiagnosticStore = create<DiagnosticState>((set, get) => ({
    input: { ...DEFAULT_INPUT },
    result: null,
    isCalculating: false,
    viewMode: "pilotage",

    updateInput: (patch) => {
        set((state) => ({
            input: { ...state.input, ...patch },
        }));
    },

    resetInput: () => {
        set({ input: { ...DEFAULT_INPUT }, result: null });
    },

    setViewMode: (mode) => {
        set({ viewMode: mode });
    },

    runDiagnostic: async () => {
        const { input } = get();

        // Guard: required fields
        if (!input.currentDPE || !input.targetDPE || !input.numberOfUnits) {
            console.warn("[DiagnosticStore] Missing required fields — aborting.");
            return;
        }

        set({ isCalculating: true });

        try {
            // ── Fill smart defaults ──────────────────────────────
            const averageSurface = input.averageUnitSurface || 65;
            const totalSurface = input.numberOfUnits * averageSurface;

            // Auto-estimate works cost if not provided
            const estimatedCostHT =
                input.estimatedCostHT && input.estimatedCostHT > 0
                    ? input.estimatedCostHT
                    : totalSurface * VALUATION_PARAMS.ESTIMATED_RENO_COST_PER_SQM;

            const fullInput: DiagnosticInput = {
                currentDPE: input.currentDPE,
                targetDPE: input.targetDPE,
                numberOfUnits: input.numberOfUnits,
                estimatedCostHT,
                averagePricePerSqm: input.averagePricePerSqm ?? 3200,
                averageUnitSurface: input.averageUnitSurface,
                commercialLots: input.commercialLots ?? 0,
                localAidAmount: input.localAidAmount ?? 0,
                alurFund: input.alurFund ?? 0,
                ceeBonus: input.ceeBonus ?? 0,
                currentEnergyBill: input.currentEnergyBill ?? 0,
                investorRatio: input.investorRatio ?? 0,
                isCostTTC: input.isCostTTC ?? true,
                includeHonoraires: input.includeHonoraires ?? true,
                // Optional fields
                ...(input.address && { address: input.address }),
                ...(input.postalCode && { postalCode: input.postalCode }),
                ...(input.city && { city: input.city }),
                ...(input.coordinates && { coordinates: input.coordinates }),
                ...(input.heatingSystem && { heatingSystem: input.heatingSystem }),
                ...(input.priceSource && { priceSource: input.priceSource }),
                ...(input.salesCount !== undefined && { salesCount: input.salesCount }),
            };

            // ── Call the pure calculator ─────────────────────────
            // Wrapped in a microtask to allow React to show loading state
            const result = await Promise.resolve(generateDiagnostic(fullInput));

            set({ result, isCalculating: false });
        } catch (error) {
            console.error("[DiagnosticStore] Calculation failed:", error);
            set({ isCalculating: false });
        }
    },
}));
