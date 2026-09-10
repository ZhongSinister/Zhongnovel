import type { NextConfig } from 'next';

/**
 * GitHub Pages serves a project repo from a subpath
 * (https://<user>.github.io/<repo>/), so the app needs a basePath.
 *
 * Override with NEXT_PUBLIC_BASE_PATH when that isn't true:
 *   - custom domain, or a <user>.github.io repo -> NEXT_PUBLIC_BASE_PATH=""
 *   - repo renamed                              -> NEXT_PUBLIC_BASE_PATH="/new-name"
 */
// Must match the GitHub repository name. The deploy workflow derives this from
// the real repo name and passes it in, so this fallback only affects local
// production builds.
const REPO = 'zhongnovel';
const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.NODE_ENV === 'production' ? `/${REPO}` : '');
const basePath = raw === '/' ? '' : raw.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // Emit a fully static site into out/ — the only thing GitHub Pages can host.
  output: 'export',
  // Produces out/arc/foo/index.html, which Pages resolves without redirect games.
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // No server means no on-demand image optimiser.
  images: { unoptimized: true },
  // Inline the resolved value so client code can build correct PDF/worker URLs.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
