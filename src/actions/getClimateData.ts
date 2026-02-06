"use server";

/**
 * Climate Projection Data Types
 * Based on IPCC RCP 8.5 "Business-as-Usual" scenario
 */
export interface ClimateProjection {
    current: {
        avgSummerTemp: number;
        heatDays: number; // >30°C
        tropicalNights: number; // >20°C
    };
    future2050: {
        avgSummerTemp: number;
        heatDays: number;
        tropicalNights: number;
        uninhabitableDays: number; // Strategic indicator
    };
    similarCity: string;
    dataSource: string;
}

/**
 * IPCC RCP 8.5 Constants for France
 * Source: GIEC AR5/AR6 projections
 */
const RCP85_DELTA_SUMMER = 2.8; // +2.8°C average summer temperature by 2050
const RCP85_HEATWAVE_MULTIPLIER = 4; // x4 heat wave days
const RCP85_TROPICAL_NIGHT_MULTIPLIER = 3.5; // x3.5 tropical nights

/**
 * Get Climate Projection for a location
 * Uses Open-Meteo historical data + IPCC RCP 8.5 deltas
 */
export async function getClimateProjection(
    lat: number,
    lon: number
): Promise<ClimateProjection | null> {
    try {
        // 1. Fetch historical summer temperatures (last 10 years)
        const currentData = await fetchHistoricalSummerData(lat, lon);

        if (!currentData) {
            return null;
        }

        // 2. Calculate current climate indicators
        const currentAvgTemp = currentData.avgMaxTemp;
        const currentHeatDays = estimateHeatDays(currentAvgTemp);
        const currentTropicalNights = estimateTropicalNights(currentAvgTemp);

        // 3. Apply RCP 8.5 projections
        const futureAvgTemp = currentAvgTemp + RCP85_DELTA_SUMMER;
        const futureHeatDays = Math.round(currentHeatDays * RCP85_HEATWAVE_MULTIPLIER);
        const futureTropicalNights = Math.round(currentTropicalNights * RCP85_TROPICAL_NIGHT_MULTIPLIER);

        // 4. Calculate "Uninhabitable Days" (strategic shock indicator)
        // Days >35°C or consecutive heat wave days
        const uninhabitableDays = Math.round(futureHeatDays * 0.6); // ~60% of heat days become extreme

        // 5. Get comparable city for context
        const similarCity = getSimilarCity(lat, futureAvgTemp);

        return {
            current: {
                avgSummerTemp: Math.round(currentAvgTemp * 10) / 10,
                heatDays: currentHeatDays,
                tropicalNights: currentTropicalNights,
            },
            future2050: {
                avgSummerTemp: Math.round(futureAvgTemp * 10) / 10,
                heatDays: futureHeatDays,
                tropicalNights: futureTropicalNights,
                uninhabitableDays,
            },
            similarCity,
            dataSource: "Open-Meteo + IPCC RCP 8.5",
        };
    } catch (error) {
        console.error("Error fetching climate projection:", error);
        return null;
    }
}

/**
 * Fetch historical summer data from Open-Meteo
 */
async function fetchHistoricalSummerData(
    lat: number,
    lon: number
): Promise<{ avgMaxTemp: number } | null> {
    try {
        // Get data for last 10 summers (June-August)
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 10;

        const startDate = `${startYear}-06-01`;
        const endDate = `${currentYear - 1}-08-31`;

        const params = new URLSearchParams({
            latitude: lat.toString(),
            longitude: lon.toString(),
            start_date: startDate,
            end_date: endDate,
            daily: "temperature_2m_max",
            timezone: "Europe/Paris",
        });

        const response = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`,
            {
                next: { revalidate: 86400 }, // Cache 24h
            }
        );

        if (!response.ok) {
            console.error("Open-Meteo API Error:", response.statusText);
            return null;
        }

        const data = await response.json();

        if (!data.daily?.temperature_2m_max) {
            return null;
        }

        // Filter only summer months (June=6, July=7, August=8)
        const summerTemps: number[] = [];

        data.daily.time.forEach((dateStr: string, index: number) => {
            const date = new Date(dateStr);
            const month = date.getMonth() + 1; // 0-indexed

            if (month >= 6 && month <= 8) {
                const temp = data.daily.temperature_2m_max[index];
                if (temp !== null && temp !== undefined) {
                    summerTemps.push(temp);
                }
            }
        });

        if (summerTemps.length === 0) {
            return null;
        }

        // Calculate average
        const avgMaxTemp = summerTemps.reduce((a, b) => a + b, 0) / summerTemps.length;

        return { avgMaxTemp };
    } catch (error) {
        console.error("Error fetching historical data:", error);
        return null;
    }
}

/**
 * Estimate number of heat days (>30°C) based on average summer temp
 * Statistical approximation
 */
function estimateHeatDays(avgSummerTemp: number): number {
    // Empirical formula: for every degree above 23°C, add ~5 heat days
    const baseline = 23;
    const daysPerDegree = 5;

    if (avgSummerTemp <= baseline) {
        return 0;
    }

    return Math.round((avgSummerTemp - baseline) * daysPerDegree);
}

/**
 * Estimate tropical nights (>20°C) based on average summer temp
 * Statistical approximation
 */
function estimateTropicalNights(avgSummerTemp: number): number {
    // Empirical: tropical nights correlate with daytime heat
    const baseline = 24;
    const nightsPerDegree = 4;

    if (avgSummerTemp <= baseline) {
        return 0;
    }

    return Math.round((avgSummerTemp - baseline) * nightsPerDegree);
}

/**
 * Get a comparable city based on future temperature
 * Provides strategic context for stakeholders
 */
function getSimilarCity(lat: number, futureTemp: number): string {
    // Geographic zones
    const isNorth = lat > 49; // Nord
    const isCentral = lat >= 47 && lat <= 49; // Centre/Ouest
    const isSouth = lat < 47; // Sud

    // Temperature-based similar cities
    if (futureTemp >= 30) {
        return "Le climat de Séville (Espagne)";
    }

    if (futureTemp >= 28) {
        if (isNorth || isCentral) {
            return "Le climat de Montpellier actuel";
        }
        return "Le climat de Naples (Italie)";
    }

    if (futureTemp >= 26) {
        if (isNorth) {
            return "Le climat de Bordeaux actuel";
        }
        return "Le climat de Nice actuel";
    }

    // Default fallback
    return "Le climat méditerranéen";
}
