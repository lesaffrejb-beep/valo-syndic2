/**
 * VALO-SYNDIC — Diagnostic Store (Zustand v5)
 * ============================================
 * Central state management for the diagnostic form.
 * Wraps the pure calculator from src/lib/calculator.ts.
 */

import { create } from "zustand";
import type { DiagnosticInput, DiagnosticResult } from "@/lib/schemas";
import { calculateDiagnosticAction } from "@/actions/calculateDiagnostic";

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
    /** Error message if Server Action fails */
    error: string | null;
    /** View mode toggle: pilotage (cockpit) vs presentation (projector) */
    viewMode: "pilotage" | "presentation";
    /** Merge a partial patch into the current input */
    updateInput: (patch: Partial<DiagnosticInput>) => void;
    /** Reset input to defaults */
    resetInput: () => void;
    /** Run the diagnostic engine via Server Action */
    runDiagnostic: () => Promise<void>;
    /** Toggle view mode */
    setViewMode: (mode: "pilotage" | "presentation") => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useDiagnosticStore = create<DiagnosticState>((set, get) => ({
    input: { ...DEFAULT_INPUT },
    result: null,
    isCalculating: false,
    error: null,
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
            console.warn("[DiagnosticStore] Champs obligatoires manquants — abandon.");
            return;
        }

        set({ isCalculating: true, error: null });

        try {
            // ── Fill smart defaults (Minimal pre-processing before Zod) ────────
            const averageSurface = input.averageUnitSurface || 65;
            const totalSurface = input.numberOfUnits * averageSurface;

            // Optional auto-estimation of HT cost if fully 0
            const estimatedCostHT =
                input.estimatedCostHT && input.estimatedCostHT > 0
                    ? input.estimatedCostHT
                    : totalSurface * 850; // Fallback hardcodé avant TS/Server

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
                devisValide: input.devisValide ?? false,
                revenusFonciersExistants: input.revenusFonciersExistants ?? 0,
                montantTravauxAmeliorationHT: input.montantTravauxAmeliorationHT ?? 0,
                ...(input.montantHonorairesSyndicHT !== undefined && { montantHonorairesSyndicHT: input.montantHonorairesSyndicHT }),
                statutLot: input.statutLot ?? 'occupant',
                optionLocAvantages: input.optionLocAvantages ?? false,
                ...(input.address && { address: input.address }),
                ...(input.postalCode && { postalCode: input.postalCode }),
                ...(input.city && { city: input.city }),
                ...(input.coordinates && { coordinates: input.coordinates }),
                ...(input.heatingSystem && { heatingSystem: input.heatingSystem }),
                ...(input.priceSource && { priceSource: input.priceSource }),
                ...(input.salesCount !== undefined && { salesCount: input.salesCount }),
            };

            // ── Call the Server Action (Black Box) ───────────────────────────
            const response = await calculateDiagnosticAction(fullInput);

            if (!response.success) {
                console.error("[DiagnosticStore] Erreur Server Action:", response.error, response.fieldErrors);
                set({
                    isCalculating: false,
                    error: response.error || "Erreur lors du calcul.",
                });
                return;
            }

            // ── Deserialize ISO Dates to native JS Dates ───────────────────────
            const rawData = response.data;
            const parsedResult: DiagnosticResult = {
                ...rawData,
                generatedAt: new Date(rawData.generatedAt),
                compliance: {
                    ...rawData.compliance,
                    prohibitionDate: rawData.compliance.prohibitionDate
                        ? new Date(rawData.compliance.prohibitionDate)
                        : null,
                },
            };

            set({ result: parsedResult, isCalculating: false, error: null });
        } catch (error) {
            console.error("[DiagnosticStore] Échec inattendu du calcul:", error);
            set({
                isCalculating: false,
                error: error instanceof Error ? error.message : "Erreur interne inconnue.",
            });
        }
    },
}));
