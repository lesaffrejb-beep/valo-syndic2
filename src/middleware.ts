import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de sécurité Next.js
 * Ajoute les headers de sécurité recommandés
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    const supabaseOrigin = (() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url) return '';
        try {
            return new URL(url).origin;
        } catch {
            return '';
        }
    })();

    // Content Security Policy
    // Use a relaxed policy in development (Next.js dev & HMR require eval/inline)
    // and a strict policy in production.
    // Determine dev mode: prefer explicit NODE_ENV, but also treat localhost/lan hosts as dev
    const hostHeader = request.headers.get('host') || '';
    // Accept hostnames with ports (eg. localhost:3000) and IPv6 loopback
    const isLocalHostHeader = /localhost|^127\.|^::1|^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.)/i.test(hostHeader);
    const isDev = process.env.NODE_ENV !== 'production' || isLocalHostHeader;

    const devConnectSrc = [
        "'self'",
        "https://api-adresse.data.gouv.fr",
        "https://georisques.gouv.fr",
        "https://maps.googleapis.com",
        "*.sentry.io",
        "data:",
    ];
    if (supabaseOrigin) devConnectSrc.push(supabaseOrigin);

    const devCsp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob: data: https://maps.googleapis.com",
        "worker-src 'self' blob: data: 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com https://tile.openstreetmap.org",
        "font-src 'self' data:",
        `connect-src ${devConnectSrc.join(' ')}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');

    const prodConnectSrc = [
        "'self'",
        "https://api-adresse.data.gouv.fr",
        "https://georisques.gouv.fr",
        "https://maps.googleapis.com",
        "https://data.ademe.fr",
        "*.sentry.io",
        "data:",
    ];
    if (supabaseOrigin) prodConnectSrc.push(supabaseOrigin);

    const prodCsp = [
        "default-src 'self'",
        // Allow inline/eval in production so PDF (WASM) can run
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data: https://maps.googleapis.com https://maps.gstatic.com",
        "worker-src 'self' blob: data:",
        // Keep inline styles allowed temporarily; migrate style props to classes later
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com https://tile.openstreetmap.org",
        "font-src 'self' data:",
        `connect-src ${prodConnectSrc.join(' ')}`,
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', isDev ? devCsp : prodCsp);

    // Empêche l'inclusion dans un iframe (clickjacking protection)
    response.headers.set('X-Frame-Options', 'DENY');

    // Empêche le sniffing MIME type
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Politique de référent restrictive
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // XSS Protection (legacy browsers)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Permissions Policy (limiter les API navigateur)
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()'
    );

    return response;
}

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
