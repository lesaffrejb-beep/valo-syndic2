/**
 * VALO-SYNDIC — Market Statistics (Hive Mind Intelligence)
 * ========================================================
 * Server Action to aggregate anonymous market data and compare
 * a user's simulation with local benchmarks.
 */

"use server";

import { supabase } from "@/lib/supabaseClient";
import type { DPELetter } from "@/lib/constants";

/**
 * Result type for local market benchmarks
 */
export type BenchmarkResult = {
    averagePrice: number;
    sampleSize: number;
} | null;

/**
 * Get local market benchmarks for a given area and renovation scope
 * 
 * @param postalCode - French postal code (5 digits)
 * @param currentDPE - Current DPE rating
 * @param targetDPE - Target DPE rating after renovation
 * @returns Market average price per m² and sample size, or null if insufficient data
 */
export async function getLocalBenchmarks(
    postalCode: string,
    currentDPE: DPELetter,
    targetDPE: DPELetter
): Promise<BenchmarkResult> {
    try {
        // Query market_stats table with filters
        const { data, error } = await supabase
            .from("market_stats")
            .select("cost_per_sqm")
            .eq("postal_code", postalCode)
            .eq("current_dpe", currentDPE)
            .eq("target_dpe", targetDPE)
            .not("cost_per_sqm", "is", null)
            .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last 12 months
            .gt("cost_per_sqm", 0); // Exclude zero/negative values

        if (error) {
            console.error("Supabase query error:", error);
            return null;
        }

        // No data found
        if (!data || data.length === 0) {
            return null;
        }

        const sampleSize = data.length;

        // Reliability threshold: need at least 3 samples
        if (sampleSize < 3) {
            return null;
        }

        // Calculate average price per m²
        const totalCost = data.reduce((sum, record) => sum + (record.cost_per_sqm || 0), 0);
        const averagePrice = Math.round(totalCost / sampleSize);

        return {
            averagePrice,
            sampleSize,
        };
    } catch (err) {
        // Silent failure - non-critical feature
        console.error("Failed to fetch market benchmarks:", err);
        return null;
    }
}
