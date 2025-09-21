import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export for production builds
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: process.env.NODE_ENV === 'production', // Only for static export
  },
  // Set output file tracing root to suppress warnings
  outputFileTracingRoot: __dirname,

  // Configure Turbopack
  turbopack: {
    resolveAlias: {
      // Polyfill buffer for client-side
      buffer: 'buffer',
    },
  },

  // Configure webpack for non-Turbopack builds (fallback)
  webpack: (config, { isServer, dev }) => {
    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      buffer: require.resolve('buffer'),
    };

    // Add WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Handle global definitions for both server and client
    const webpack = require('webpack');
    config.plugins = config.plugins || [];

    if (isServer) {
      // Server-side: define self and window as global
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'globalThis',
          'window': 'globalThis',
        })
      );
    } else {
      // Client-side: define global as window/self
      config.plugins.push(
        new webpack.DefinePlugin({
          'global': 'globalThis',
        })
      );
    }

    // Development optimizations
    if (dev) {
      // Optimize module resolution for development
      config.resolve.symlinks = false;

      // Disable some optimizations that can cause issues in dev
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }

    return config;
  },
};

export default nextConfig;
