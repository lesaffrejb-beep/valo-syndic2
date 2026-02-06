'use client';

import { type DiagnosticResult } from '@/lib/schemas';

interface DownloadConvocationButtonProps {
    result: DiagnosticResult;
}

/**
 * BOUTON DÉSACTIVÉ — V2 Feature
 * 
 * Ce bouton sera activé dans la V2 avec :
 * - Génération de projet de résolution personnalisé
 * - Modèles juridiques conformes
 * - Intégration e-signature
 * 
 * TODO: Implémenter la génération de projet de résolution
 * ISSUE: Nécessite validation juridique des modèles
 */
export function DownloadConvocationButton({ result }: DownloadConvocationButtonProps) {
    return (
        <button
            disabled
            title="Bientôt disponible"
            className="btn-secondary opacity-40 grayscale cursor-not-allowed flex items-center justify-center gap-2 relative"
        >
            <span>📄</span>
            <span className="hidden sm:inline">Projet de Résolution</span>
        </button>
    );
}
