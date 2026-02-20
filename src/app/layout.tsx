import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AppProviders } from "@/components/AppProviders";

// ── Typographie Serif : Cormorant Garamond (Authoritative / Editorial) ──
const cormorantGaramond = Cormorant_Garamond({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-serif",
    weight: ["400", "500", "600", "700"],
});

// ── Typographie Sans : Plus Jakarta Sans (Clean / Geometric / Legible) ──
const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-jakarta",
    weight: ["300", "400", "500", "600", "700"],
});

// ── Typographie Mono : Pour données financières alignées ──
const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-mono",
    weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
    title: "VALO-SYNDIC | Diagnostic Patrimonial",
    description:
        "Votre plan de valorisation patrimoniale en 60 secondes. Simulation MaPrimeRénov' Copropriété et Éco-PTZ.",
    keywords: [
        "syndic",
        "copropriété",
        "rénovation énergétique",
        "DPE",
        "MaPrimeRénov",
        "financement travaux",
        "patrimoine immobilier",
    ],
    authors: [{ name: "VALO-SYNDIC" }],
    robots: "noindex, nofollow", // MVP privé
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${cormorantGaramond.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
            <body className="min-h-screen bg-alabaster font-sans antialiased">
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
