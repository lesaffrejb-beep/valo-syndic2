'use client';

import dynamic from 'next/dynamic';
import { type DiagnosticResult } from '@/lib/schemas';
import { useState, useEffect } from 'react';

// Dynamic import of the component that uses @react-pdf/renderer
// ensuring NO imports from that library happen in the main bundle/SSR.
const PdfButtonContent = dynamic(
    () => import('./PdfButtonContent').then((mod) => mod.PdfButtonContent),
    {
        ssr: false,
        loading: () => (
            <button disabled className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2">
                ⏳ <span className="hidden sm:inline">Chargement PDF...</span>
            </button>
        ),
    }
);

interface DownloadPdfButtonProps {
    result: DiagnosticResult;
    variant?: string;
    className?: string;
}

export function DownloadPdfButton({ result, variant, className }: DownloadPdfButtonProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    // Map "primary" to "enhanced" for now, or pass through if it matches
    const contentVariant: 'standard' | 'enhanced' = variant === 'primary' ? 'enhanced' : (variant as 'standard' | 'enhanced') || 'enhanced';

    return <PdfButtonContent result={result} variant={contentVariant} className={className} />;
}
