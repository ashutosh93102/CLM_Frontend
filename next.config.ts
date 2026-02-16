import type { NextConfig } from 'next';
import path from 'path';

const isStaticExport = process.env.STATIC_EXPORT === '1'

const nextConfig: NextConfig = {
  // Keep config minimal; Turbopack has been unstable in this repo.
  outputFileTracingRoot: path.resolve(__dirname),
  ...(isStaticExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
