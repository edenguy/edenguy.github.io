import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// The app is published under https://edenguy.github.io/nitrox-academy/.
// NITROX_BASE overrides it for a preview host served from a different path.
const base = process.env.NITROX_BASE ?? '/nitrox-academy/';
// A preview host may not support a service worker; NITROX_NO_PWA skips registering one.
const withPwa = process.env.NITROX_NO_PWA !== '1';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    ...(withPwa ? [VitePWA({
      // 'prompt' lets the in-app card offer the reload instead of reloading mid-quiz.
      registerType: 'prompt',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'אקדמיית נייטרוקס',
        short_name: 'נייטרוקס',
        description:
          'להבין אוויר מועשר (נייטרוקס): שיעורים אינטראקטיביים, סימולציות ומבחני תרגול. כלי לימודי בלבד, אינו הסמכה.',
        theme_color: '#050b16',
        background_color: '#050b16',
        display: 'standalone',
        start_url: base,
        scope: base,
        lang: 'he',
        dir: 'rtl',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: `${base}index.html`,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    })] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Without the PWA plugin the virtual module does not exist, so swap in a stub.
      ...(withPwa
        ? {}
        : { 'virtual:pwa-register/react': fileURLToPath(new URL('./src/app/pwa-register-stub.ts', import.meta.url)) }),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // The built app is committed to the repo root so GitHub Pages serves it as-is.
    outDir: process.env.NITROX_OUT_DIR ?? '../../nitrox-academy',
    emptyOutDir: true,
  },
});
