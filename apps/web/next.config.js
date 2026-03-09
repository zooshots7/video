/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@video-editor/shared", "@video-editor/video", "remotion", "@remotion/player"],
};

module.exports = nextConfig;
