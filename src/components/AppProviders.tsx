"use client";

import { ProjectionModeProvider } from "@/components/ui/ProjectionModeProvider";


interface AppProvidersProps {
    children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <>
            <ProjectionModeProvider />
            {children}
        </>
    );
}
