'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Global Error Boundary — Root Level
 * Capture les erreurs critiques hors React tree
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error('Critical application error:', error);
    }, [error]);

    return (
        <html lang="fr">
            <body className="min-h-screen flex flex-col items-center justify-center bg-[#0B0C0E] text-white p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-danger/10 rounded-2xl flex items-center justify-center border border-danger/20">
                        <span className="text-4xl">🚨</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white">
                        Erreur Système Critique
                    </h2>

                    <p className="text-slate-400">
                        L&apos;application a rencontré une erreur irrécoverable. Veuillez recharger la page.
                    </p>

                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-primary text-slate-900 font-semibold rounded-xl hover:bg-primary-400 transition-colors"
                    >
                        🔄 Recharger l&apos;application
                    </button>
                </div>
            </body>
        </html>
    );
}
