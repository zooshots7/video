/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@video-editor/shared", "@video-editor/export-adapter", "@video-editor/video", "remotion", "@remotion/player"],
    experimental: {
        serverComponentsExternalPackages: [
            "@remotion/renderer",
            "@remotion/bundler",
            "@remotion/cli",
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't bundle these server-only packages on the client
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
                child_process: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
