import { type DPELetter } from "@/lib/constants";

export const DEFAULT_VALUES = {
    pricePerSqm: 3500,
    avgSurfacePerLot: 62,
    renoCostPerSqm: 350,
};

export type SimulationApiData = {
    address?: string;
    postalCode?: string;
    city?: string;
    cityCode?: string;
    coordinates?: { latitude: number; longitude: number };
    dpe_label?: DPELetter;
    living_area?: number;
    total_surface?: number;
    total_units?: number;
    number_of_units?: number;
    numberOfUnits?: number;
    price_per_sqm?: number;
    pricePerSqm?: number;
};

function toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed;
}

export function mergeDataWithDefaults(apiData?: SimulationApiData | null) {
    if (!apiData) {
        return {
            numberOfLots: null,
            totalSurface: 0,
            currentDpe: "F" as DPELetter,
            targetDpe: "C" as DPELetter,
            workBudget: 0,
            cityCode: undefined,
            pricePerSqm: DEFAULT_VALUES.pricePerSqm,
        };
    }

    const lots =
        toNumber(apiData.total_units) ??
        toNumber(apiData.number_of_units) ??
        toNumber(apiData.numberOfUnits) ??
        null;

    let surface =
        toNumber(apiData.living_area) ??
        toNumber(apiData.total_surface) ??
        null;

    if (!surface && lots) {
        surface = lots * DEFAULT_VALUES.avgSurfacePerLot;
    }

    const pricePerSqm =
        toNumber(apiData.price_per_sqm) ??
        toNumber(apiData.pricePerSqm) ??
        DEFAULT_VALUES.pricePerSqm;

    const estimatedBudget = surface ? surface * DEFAULT_VALUES.renoCostPerSqm : 0;

    return {
        numberOfLots: lots,
        totalSurface: surface || 0,
        currentDpe: apiData.dpe_label || ("F" as DPELetter),
        targetDpe: "C" as DPELetter,
        workBudget: estimatedBudget,
        cityCode: apiData.cityCode,
        pricePerSqm,
    };
}
