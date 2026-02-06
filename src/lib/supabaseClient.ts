import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// In CI or build env these vars may be missing. To avoid breaking client bundles,
// only throw fail-fast on the server. In the browser, we warn and provide
// a placeholder client to keep the app interactive (but read-only).
if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
        throw new Error(
            'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
        );
    } else {
        console.warn(
            'Supabase environment variables are missing in the browser. Supabase features will be disabled.'
        );
    }
}

const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);
