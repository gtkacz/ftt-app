import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/ftt-app/",
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    viteCompression(),
    VitePWA(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
});
