/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't bundle the transformers / ONNX runtime — they use native .node files.
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("@xenova/transformers", "onnxruntime-node", "sharp");
    }
    return config;
  },
};

export default nextConfig;
