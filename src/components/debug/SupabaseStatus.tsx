"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseStatus() {
    const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');

    useEffect(() => {
        // Log de l'objet supabase comme demandé
        console.log('Supabase instance:', supabase);

        // Petit test de connexion pour rendre le composant "intelligent"
        const checkConnection = async () => {
            try {
                // On tente une requête simple (même si la table n'existe pas, on verra si l'URL est bonne)
                const { error } = await supabase.from('_connection_test').select('*').limit(1);

                // Si l'erreur est liée à une table inexistante, c'est que la connexion est OK (le client a pu parler à l'API)
                // Les erreurs 401/403/404 (non trouvé) sont "normales" si la table n'existe pas mais que l'URL est valide
                if (error && error.code === 'PGRST116') {
                    setStatus('connected');
                } else if (error) {
                    setStatus('error');
                } else {
                    setStatus('connected');
                }
            } catch (err) {
                console.error('Supabase connection error:', err);
                setStatus('error');
            }
        };

        checkConnection();
    }, []);

    return (
        <div className="card-bento max-w-md mx-auto my-8 group hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-main">Debug : Supabase</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'loading' ? 'bg-surface text-muted' :
                    status === 'connected' ? 'bg-success/10 text-success' :
                        'bg-danger/10 text-danger'
                    }`}>
                    {status}
                </div>
            </div>

            <p className="text-sm text-muted mb-4">
                Vérifiez la console du navigateur pour voir l&apos;objet <code>supabase</code> complet.
            </p>

            <div className="bg-app-darker p-4 rounded-input border border-boundary">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted">URL :</span>
                        <span className="text-main font-mono truncate ml-4">
                            {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Non définie'}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted">Key :</span>
                        <span className="text-main font-mono truncate ml-4">
                            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-8) : 'Non définie'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
