'use client';

import { useState } from 'react';
import { type DiagnosticResult } from '@/lib/schemas';
import { useBrandStore } from '@/stores/useBrandStore';
import { generateAGPresentation, getPresentationMetadata } from '@/lib/pptx-generator';

interface PptxButtonContentProps {
    result: DiagnosticResult;
}

export function PptxButtonContent({ result }: PptxButtonContentProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const brand = useBrandStore((state) => state.brand);
    const v2Badge = (
        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-black text-gold px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.35)]">
            V2
        </span>
    );

    const metadata = getPresentationMetadata(result);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const brandSettings = brand ? {
                agencyName: brand.agencyName,
                primaryColor: brand.primaryColor,
                logoUrl: brand.logoUrl || undefined,
            } : undefined;

            const blob = await generateAGPresentation(result, brandSettings) as Blob;

            // Téléchargement
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Presentation_AG_${new Date().toISOString().split('T')[0]}.pptx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur génération PPTX:', error);
            alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                onMouseEnter={() => setShowPreview(true)}
                onMouseLeave={() => setShowPreview(false)}
                className="relative btn-secondary flex items-center justify-center gap-2 group cursor-pointer hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGenerating ? (
                    <>
                        <span className="animate-spin">*</span>
                        <span>Génération...</span>
                        {v2Badge}
                    </>
                ) : (
                    <>
                        <span>[PPTX]</span>
                        <span>PowerPoint AG</span>
                        {v2Badge}
                    </>
                )}
            </button>

            {/* Preview tooltip */}
            {showPreview && !isGenerating && (
                <div className="absolute bottom-full left-0 mb-2 w-72 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        Présentation AG
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {metadata.slideCount} slides • {metadata.estimatedDuration}
                    </p>
                    <div className="space-y-2">
                        {metadata.keyFigures.map((fig, i) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-300">{fig.label}</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{fig.value}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 italic">
                        Optimisé pour projection en salle
                    </p>
                </div>
            )}
        </div>
    );
}

export default PptxButtonContent;
