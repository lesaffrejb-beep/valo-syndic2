'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFDocument } from './PDFDocument';
import { PDFDocumentEnhanced } from './PDFDocumentEnhanced';
import { PDFReportAG } from './PDFReportAG';
import { type DiagnosticResult } from '@/lib/schemas';
import { useBrandStore } from "@/stores/useBrandStore";
import { type OwnerProfileType } from '@/lib/pdf-profiles';
import { FileText } from 'lucide-react';

interface PdfButtonContentProps {
    result: DiagnosticResult;
    variant?: 'standard' | 'enhanced' | 'ag' | undefined;
    targetProfile?: OwnerProfileType | undefined;
    className?: string | undefined;
}

export function PdfButtonContent({
    result,
    variant = 'enhanced',
    targetProfile,
    className
}: PdfButtonContentProps) {
    const brand = useBrandStore((state) => state.brand);

    // Build brand object explicitly
    const pdfBrand = brand ? {
        agencyName: brand.agencyName || 'VALO SYNDIC',
        primaryColor: brand.primaryColor || '#B8860B',
        logoUrl: brand.logoUrl || undefined,
        contactEmail: brand.contactEmail || undefined,
        contactPhone: brand.contactPhone || undefined,
    } : undefined;

    // Choose document based on variant
    const DocumentComponent =
        variant === 'ag' ? PDFReportAG :
            variant === 'enhanced' ? PDFDocumentEnhanced :
                PDFDocument;

    // Default class if none provided
    const buttonClass = className || "btn-primary flex items-center justify-center gap-2 group cursor-pointer hover:opacity-90 transition-all shadow-lg hover:shadow-xl";
    const wrapperClass = `relative ${buttonClass}`;

    return (
        <PDFDownloadLink
            document={
                <DocumentComponent
                    result={result}
                    brand={pdfBrand as { agencyName?: string; primaryColor?: string; logoUrl?: string; contactEmail?: string; contactPhone?: string }}
                    targetProfile={targetProfile}
                    showAllProfiles={true}
                />
            }
            fileName={`audit-valo-syndic-${new Date().toISOString().split('T')[0]}.pdf`}
            className={wrapperClass}
        >
            {/* @ts-ignore */}
            {({ loading, error }: { loading: boolean; error: Error | null }) => {
                if (error) console.error("PDF Generation Error:", error);

                if (loading) {
                    return (
                        <>
                            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Génération...</span>
                        </>
                    );
                }

                if (error) {
                    return (
                        <>
                            <FileText className="w-5 h-5" />
                            <span>Erreur</span>
                        </>
                    );
                }

                return (
                    <>
                        <FileText className="w-4 h-4" />
                        <span>Télécharger le Rapport</span>
                    </>
                );
            }}
        </PDFDownloadLink>
    );
}

export default PdfButtonContent;
