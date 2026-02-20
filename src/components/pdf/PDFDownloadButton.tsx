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
}

export default function PDFDownloadButton({ document, fileName }: Props) {
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

    if (!mounted || !PDFDownloadLink) {
        return (
            <button
                type="button"
                disabled
                className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border bg-white text-xs font-semibold text-subtle cursor-wait"
            >
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                Chargement…
            </button>
        );
    }

    return (
        <PDFDownloadLink document={document} fileName={fileName}>
            {({ loading }) => (
                <button
                    type="button"
                    disabled={loading}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-xs font-semibold transition-colors duration-150
                        ${loading
                            ? "border-border bg-white text-subtle cursor-wait"
                            : "border-border bg-white text-slate hover:bg-navy hover:text-white hover:border-navy shadow-sm"
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                            Génération…
                        </>
                    ) : (
                        <>
                            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Télécharger le Rapport
                        </>
                    )}
                </button>
            )}
        </PDFDownloadLink>
    );
}
