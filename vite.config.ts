import vue from "@vitejs/plugin-vue";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  base: "/ftt-app/",
  plugins: [
    vue(),
    vuetify({
      autoImport: { labs: true },
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // App shell only — the icon font (~4.7MB) must never block SW install
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
        navigateFallback: "/ftt-app/index.html",
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/ftt-backend-api\.(tkacz\.dev\.br|loca\.lt)\/api\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\.(?:woff2?|ttf|otf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpe?g|gif|webp|avif|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        id: "/ftt-app/",
        scope: "/ftt-app/",
        start_url: "/ftt-app/",
        name: "Fantasy Trash Talk",
        short_name: "FTT",
        description:
          "Fantasy basketball league management — drafts, trades, rosters and trash talk.",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0F183E",
        background_color: "#0F183E",
        categories: ["sports", "entertainment"],
        icons: [
          {
            src: "/ftt-app/icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ftt-app/icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/ftt-app/icons/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(process.env.VITE_BUILD_TIME || Date.now()),
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        nested: resolve(__dirname, "404.html"),
      },
      output: {
        // Vuetify rarely changes between deploys — isolate it so app updates don't bust its cache
        manualChunks(id: string) {
          if (id.includes("node_modules/vuetify")) {
            return "vuetify";
          }
        },
      },
    },
  },
});
