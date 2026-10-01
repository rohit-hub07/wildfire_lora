import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Node-only vector/ML clients out of the Turbopack client/server bundle.
  // `transpilePackages: ['chromadb', ...]` was forcing Turbopack to bundle
  // `@chroma-core/ai-embeddings-common/README.md` -> "Unknown module type".
  serverExternalPackages: [
    'chromadb',
    'chromadb-default-embed',
    '@chroma-core/default-embed',
    '@chroma-core/ai-embeddings-common',
    '@huggingface/transformers',
  ],
  turbopack: {
    rules: {
      // Chroma packages ship README.md files that Turbopack would otherwise
      // try to parse as modules ("Unknown module type"). Swallow them.
      '*.md': {
        loaders: ['ignore-loader'],
        as: '*.js',
      },
    },
  },
  // NOTE: `@chroma-core/default-embed` also ships a broken
  // `dist/cjs/default-embed.d.cts` (ESM syntax in a CJS-scoped file) which
  // crashes Turbopack externals-tracing. Loader rules don't apply to that
  // phase, so it is removed on every install by
  // `scripts/fixChromaPackaging.cjs` (postinstall hook).
};

export default nextConfig;
