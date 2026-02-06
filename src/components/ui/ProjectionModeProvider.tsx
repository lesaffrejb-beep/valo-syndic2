"use client";

import { useEffect } from "react";
import { useProjectionMode } from "@/hooks/useProjectionMode";

export function ProjectionModeProvider() {
    const { isProjectionMode } = useProjectionMode();

    useEffect(() => {
        if (isProjectionMode) {
            document.body.classList.add("projection-mode");
        } else {
            document.body.classList.remove("projection-mode");
        }
    }, [isProjectionMode]);

    return null;
}
