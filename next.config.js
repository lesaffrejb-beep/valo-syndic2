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
};

module.exports = nextConfig;
