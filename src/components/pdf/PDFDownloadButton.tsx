"use client";

/**
 * VALO-SYNDIC — PDFDownloadButton
 * ================================
 * SSR-safe wrapper for @react-pdf/renderer's PDFDownloadLink.
 * Only renders on client to avoid Next.js SSR hydration errors.
 */

import { useState, useEffect, type ReactElement } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
    document: ReactElement;
    fileName: string;
    className?: string;
}

export default function PDFDownloadButton({ document, fileName, className }: Props) {
    const [mounted, setMounted] = useState(false);
    const [PDFDownloadLink, setPDFDownloadLink] = useState<React.ComponentType<{
        document: ReactElement;
        fileName: string;
        children: (params: { loading: boolean; url: string | null; error: Error | null }) => React.ReactNode;
    }> | null>(null);

    useEffect(() => {
        setMounted(true);
        // Dynamic import to avoid SSR issues
        import("@react-pdf/renderer").then((mod) => {
            setPDFDownloadLink(() => mod.PDFDownloadLink as unknown as typeof PDFDownloadLink);
        });
    }, []);

    const baseClass = className || "btn-secondary";

    if (!mounted || !PDFDownloadLink) {
        return (
            <button
                type="button"
                disabled
                className={`${baseClass} gap-2 opacity-70 cursor-wait flex items-center justify-center`}
            >
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                <span className="hidden sm:inline">Chargement…</span>
            </button>
        );
    }

    return (
        <PDFDownloadLink document={document} fileName={fileName}>
            {({ loading }) => (
                <button
                    type="button"
                    disabled={loading}
                    className={`${baseClass} gap-2 flex items-center justify-center ${loading ? "opacity-70 cursor-wait" : ""}`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                            <span className="hidden sm:inline">Génération…</span>
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" strokeWidth={1.5} />
                            <span className="hidden sm:inline">Télécharger le Rapport</span>
                        </>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
}
