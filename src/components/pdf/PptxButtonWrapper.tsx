'use client'

import dynamic from 'next/dynamic'
import type { DiagnosticResult } from '@/lib/schemas'

/**
 * Wrapper SSR-safe pour le bouton PPTX
 * Utilise next/dynamic pour charger le composant uniquement côté client
 * et éviter les erreurs SSR avec pptxgenjs
 */
const DownloadPptxButton = dynamic(
    () => import('./DownloadPptxButton').then(mod => ({ default: mod.DownloadPptxButton })),
    {
        ssr: false,
        loading: () => (
            <button disabled className="btn-secondary opacity-50 cursor-not-allowed flex items-center gap-2">
                <span>⏳</span>
                <span className="hidden sm:inline">Chargement...</span>
            </button>
        )
    }
)

interface Props {
    result: DiagnosticResult
}

export function PptxButtonWrapper({ result }: Props) {
    return <DownloadPptxButton result={result} />
}
