/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@react-pdf/renderer'],
    webpack: (config, { isServer, webpack }) => {
        config.resolve.alias.canvas = false;

        if (!isServer) {
            // FALLBACKS
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                https: false,
                http: false,
                "node:fs": false,
                "node:https": false,
                child_process: false,
                tls: false,
                net: false,
            };

            // IGNORE PLUGIN for node: schemes (Nuclear Option for Webpack 5)
            // Fixes "node:https" errors from pptxgenjs/other libs
            config.plugins.push(
                new webpack.IgnorePlugin({
                    resourceRegExp: /^node:/,
                })
            );
        }
        return config;
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org; font-src 'self' data:; connect-src 'self' https://api-adresse.data.gouv.fr https://api.dvf.etalab.gouv.fr https://data.ademe.fr https://*.supabase.co; frame-src 'self' https://www.youtube.com;",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
