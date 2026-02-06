/**
 * Market Benchmark Service — Module "Market Watchdog"
 * =====================================================
 * Évalue le coût des travaux par rapport aux références régionales.
 * Data Source: public/data/market_benchmarks_49.json
 */

import { z } from "zod";

// =============================================================================
// 1. SCHEMAS
// =============================================================================

export const BenchmarkDataSchema = z.object({
    region: z.string(),
    source: z.string(),
    updatedAt: z.string(),
    benchmarks: z.object({
        pricePerLot: z.object({
            min: z.number(),
            median: z.number(),
            max: z.number(),
            unit: z.string(),
            description: z.string(),
        }),
        pricePerSqm: z.object({
            min: z.number(),
            median: z.number(),
            max: z.number(),
            unit: z.string(),
            description: z.string(),
        }),
    }),
    tolerances: z.object({
        green: z.number(),
        yellow: z.number(),
        description: z.string(),
    }),
    notes: z.array(z.string()),
});

export type BenchmarkData = z.infer<typeof BenchmarkDataSchema>;

export type BenchmarkStatus = "green" | "yellow" | "red";

export interface BenchmarkResult {
    status: BenchmarkStatus;
    label: string;
    percentVsMedian: number;
    medianValue: number;
    userValue: number;
}

// =============================================================================
// 2. CACHE
// =============================================================================

let cachedBenchmarks: BenchmarkData | null = null;

// =============================================================================
// 3. SERVICE FUNCTIONS
// =============================================================================

/**
 * Load benchmark data from static JSON file.
 * Uses in-memory cache to avoid repeated fetches.
 */
export async function loadBenchmarks(): Promise<BenchmarkData | null> {
    if (cachedBenchmarks) {
        return cachedBenchmarks;
    }

    try {
        const response = await fetch("/data/market_benchmarks_49.json");
        if (!response.ok) {
            console.error("Failed to load benchmark data:", response.status);
            return null;
        }

        const data: unknown = await response.json();
        const parsed = BenchmarkDataSchema.safeParse(data);

        if (!parsed.success) {
            console.error("Invalid benchmark data format:", parsed.error);
            return null;
        }

        cachedBenchmarks = parsed.data;
        return cachedBenchmarks;
    } catch (error) {
        console.error("Error loading benchmarks:", error);
        return null;
    }
}

/**
 * Evaluate cost per lot against regional benchmarks.
 * 
 * @param totalCostHT - Coût total travaux HT (€)
 * @param numberOfUnits - Nombre de lots
 * @returns Benchmark evaluation result
 */
export async function evaluateCostPerLot(
    totalCostHT: number,
    numberOfUnits: number
): Promise<BenchmarkResult | null> {
    const benchmarks = await loadBenchmarks();
    if (!benchmarks || numberOfUnits <= 0) {
        return null;
    }

    const costPerLot = totalCostHT / numberOfUnits;
    const median = benchmarks.benchmarks.pricePerLot.median;
    const { green, yellow } = benchmarks.tolerances;

    const ratio = costPerLot / median;
    const percentVsMedian = Math.round((ratio - 1) * 100);

    let status: BenchmarkStatus;
    let label: string;

    if (ratio <= green) {
        status = "green";
        label = "Prix Marché (Angers)";
    } else if (ratio <= yellow) {
        status = "yellow";
        label = `+${percentVsMedian}% vs référence`;
    } else {
        status = "red";
        label = `Estimation haute (+${percentVsMedian}%)`;
    }

    return {
        status,
        label,
        percentVsMedian,
        medianValue: median,
        userValue: costPerLot,
    };
}

/**
 * Synchronous version for use in components that already have benchmark data.
 */
export function evaluateCostPerLotSync(
    totalCostHT: number,
    numberOfUnits: number,
    benchmarks: BenchmarkData
): BenchmarkResult {
    const costPerLot = totalCostHT / numberOfUnits;
    const median = benchmarks.benchmarks.pricePerLot.median;
    const { green, yellow } = benchmarks.tolerances;

    const ratio = costPerLot / median;
    const percentVsMedian = Math.round((ratio - 1) * 100);

    let status: BenchmarkStatus;
    let label: string;

    if (ratio <= green) {
        status = "green";
        label = "Prix Marché (Angers)";
    } else if (ratio <= yellow) {
        status = "yellow";
        label = `+${percentVsMedian}% vs référence`;
    } else {
        status = "red";
        label = `Estimation haute (+${percentVsMedian}%)`;
    }

    return {
        status,
        label,
        percentVsMedian,
        medianValue: median,
        userValue: costPerLot,
    };
}
