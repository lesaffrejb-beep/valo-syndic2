import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AppProviders } from "@/components/AppProviders";

// Typographie Premium : Plus Jakarta Sans (Swiss Style)
// Weight 500 for medium titles, 400 for body, 600 for emphasis
const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-jakarta",
    weight: ["300", "400", "500", "600", "700"],
});

// Typographie Mono : Pour données financières alignées
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
        <html lang="fr" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
            <body className="min-h-screen bg-deep font-sans antialiased">
                <AppProviders>{children}</AppProviders>
            </body>
        </html>
    );
}
