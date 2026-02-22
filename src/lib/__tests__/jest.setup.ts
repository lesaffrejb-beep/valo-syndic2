/**
 * Setup Jest — Variables d'environnement factices pour les tests unitaires.
 * Évite que supabaseClient.ts crash en l'absence des vraies vars d'env.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-jest-tests';
