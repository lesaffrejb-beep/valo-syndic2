import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BrandSettings {
    agencyName: string;
    logoUrl: string | null;
    primaryColor: string;
    contactEmail: string;
    contactPhone: string;
}

interface BrandState {
    brand: BrandSettings;
    updateBrand: (settings: Partial<BrandSettings>) => void;
    resetBrand: () => void;
}

const DEFAULT_BRAND: BrandSettings = {
    agencyName: "VALO-SYNDIC",
    logoUrl: null,
    primaryColor: "#0f172a", // slate-900 default
    contactEmail: "contact@valo-syndic.fr",
    contactPhone: "01 23 45 67 89",
};

export const useBrandStore = create<BrandState>()(
    persist(
        (set) => ({
            brand: DEFAULT_BRAND,
            updateBrand: (settings) =>
                set((state) => ({
                    brand: { ...state.brand, ...settings },
                })),
            resetBrand: () => set({ brand: DEFAULT_BRAND }),
        }),
        {
            name: "valo_brand_settings",
        }
    )
);
