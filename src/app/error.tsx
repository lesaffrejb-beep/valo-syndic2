'use client';

import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Error Boundary — Page Level
 * Capture les erreurs React dans l'application
 */
export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log vers service de monitoring (Sentry, etc.)
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0C0E] text-white p-6">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto bg-danger/10 rounded-2xl flex items-center justify-center border border-danger/20">
                    <span className="text-4xl">⚠️</span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white">
                    Diagnostic temporairement indisponible
                </h2>

                {/* Description */}
                <p className="text-slate-400">
                    Une erreur technique est survenue. Vos données de simulation sont conservées dans votre navigateur.
                </p>

                {/* Error details (dev mode) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="p-4 bg-surface rounded-xl border border-boundary text-left">
                        <p className="text-xs text-danger-500 font-mono mb-2">Error: {error.message}</p>
                        {error.digest && (
                            <p className="text-xs text-muted font-mono">Digest: {error.digest}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-primary text-slate-900 font-semibold rounded-xl hover:bg-primary-400 transition-colors"
                    >
                        🔄 Réessayer
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-surface border border-boundary text-white font-medium rounded-xl hover:bg-surface-hover transition-colors"
                    >
                        ← Retour à l&apos;accueil
                    </button>
                </div>

                {/* Support hint */}
                <p className="text-xs text-slate-500">
                    Si le problème persiste, contactez le support technique.
                </p>
            </div>
        </div>
    );
}
