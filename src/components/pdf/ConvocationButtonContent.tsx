'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { ConvocationDocument } from './ConvocationDocument';
import { type DiagnosticResult } from '@/lib/schemas';
import { useBrandStore } from "@/stores/useBrandStore";

interface ConvocationButtonContentProps {
    result: DiagnosticResult;
}

export function ConvocationButtonContent({ result }: ConvocationButtonContentProps) {
    const brand = useBrandStore((state) => state.brand);

    return (
        <PDFDownloadLink
            document={<ConvocationDocument result={result} brand={brand} />}
            fileName={`convocation-ag-${new Date().toISOString().split('T')[0]}.pdf`}
            className="btn-secondary flex items-center justify-center gap-2 group cursor-pointer hover:opacity-90 transition-all shadow-sm hover:shadow-md"
        >
            {({ blob, url, loading, error }: { blob: Blob | null; url: string | null; loading: boolean; error: Error | null }) => {
                if (loading) {
                    return (
                        <>
                            <span className="animate-spin">⏳</span>
                            <span>Génération...</span>
                        </>
                    );
                }
                return (
                    <>
                        <span>⚖️</span>
                        <span>Projet de Résolution</span>
                    </>
                );
            }}
        </PDFDownloadLink>
    );
}
