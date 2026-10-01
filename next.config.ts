import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['chromadb', '@chroma-core/default-embed'],
  turbo: {
    rules: {
      '*.md': { loaders: ['raw-loader'], }
    }
  },
};

export default nextConfig;
