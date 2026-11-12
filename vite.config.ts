import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pagesBase = process.env.PAGES_BASE?.trim();
const androidBuild = process.env.BUILD_TARGET === 'android';
const base = androidBuild
  ? './'
  : pagesBase
    ? `/${pagesBase.replace(/^\/+|\/+$/g, '')}/`
    : '/';

const pwa = VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  manifest: {
    name: '动分 · 运动计分',
    short_name: '动分',
    description: '把每一次训练，变成看得见的积累。',
    lang: 'zh-CN',
    start_url: base,
    scope: base,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f3efe6',
    theme_color: '#ef6a3a',
    categories: ['fitness', 'health', 'lifestyle'],
    icons: [
      {
        src: `${base}icons/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${base}icons/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: `${base}icons/icon-maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    cleanupOutdatedCaches: true,
    navigateFallback: `${base}index.html`,
  },
  devOptions: {
    enabled: false,
  },
});

export default defineConfig({
  base,
  plugins: [react(), ...(androidBuild ? [] : [pwa])],
});