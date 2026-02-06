"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectionModeState {
    isProjectionMode: boolean;
    toggleProjectionMode: () => void;
    setProjectionMode: (value: boolean) => void;
}

export const useProjectionMode = create<ProjectionModeState>()(
    persist(
        (set) => ({
            isProjectionMode: false,
            toggleProjectionMode: () =>
                set((state) => ({ isProjectionMode: !state.isProjectionMode })),
            setProjectionMode: (value: boolean) =>
                set({ isProjectionMode: value }),
        }),
        {
            name: "valo-syndic-projection-mode",
        }
    )
);
