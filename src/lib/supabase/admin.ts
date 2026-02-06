import { createClient } from '@supabase/supabase-js';

// Vérification de sécurité au runtime
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY manquante. Impossible de créer le client Admin.");
}

// Ce client contourne TOUTES les règles de sécurité RLS.
// À utiliser UNIQUEMENT dans des Server Actions ou des scripts API.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false, // Pas de session utilisateur nécessaire pour l'admin
        },
    }
);
