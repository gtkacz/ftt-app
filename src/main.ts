import "@fontsource-variable/space-grotesk";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { registerSW } from "virtual:pwa-register";
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import App from "./App.vue";
import { aliases, mds } from "./iconsets/mds";
import router from "./router";

// Custom styles
import "./styles/main.scss";

// Custom plugins
import errorSnackbarPlugin from "@/plugins/errorSnackbar.ts";

// Custom directives
import { vConfirm } from "@/directives/v-confirm.ts";

// Custom components
import AppLogo from "@/components/common/AppLogo.vue";
import Countdown from "@/components/common/Countdown.vue";
import LabeledDivider from "@/components/common/LabeledDivider.vue";
import ThemeChanger from "@/components/common/ThemeChanger.vue";
import Word from "@/components/common/Word.vue";

// Keep installed PWAs current: check for a new service worker every hour
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 60 * 1000);
    }
  },
});

// A deploy invalidates old chunk hashes; reload once instead of dying on stale lazy imports
window.addEventListener("vite:preloadError", (event) => {
  if (!sessionStorage.getItem("chunk-reload")) {
    sessionStorage.setItem("chunk-reload", "1");
    event.preventDefault();
    window.location.reload();
  }
});
window.addEventListener("load", () => sessionStorage.removeItem("chunk-reload"));

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Detect user's system theme preference
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

const vuetify = createVuetify({
  display: {
    mobileBreakpoint: "md",
  },
  theme: {
    defaultTheme: prefersDark ? "dark" : "light",
    themes: {
        light: {
          colors: {
            primary: "#142052",
            secondary: "#B54708",
            accent: "#B54708",
            background: "#F5F7FB",
            surface: "#FFFFFF",
            "surface-variant": "#EDF1F8",
            "on-background": "#111827",
            "on-surface": "#111827",
            "on-surface-variant": "#475467",
            "on-primary": "#FFFFFF",
            "on-secondary": "#FFFFFF",
            subtle: "#3448A5",
            danger: "#D92D20",
            error: "#D92D20",
            success: "#067647",
            warning: "#DC6803",
            info: "#0878A4",
            gray: "#667085",
            grey: "#667085",
          },
        },
        dark: {
          colors: {
            primary: "#142052",
            secondary: "#FF9D24",
            accent: "#FF9D24",
            background: "#070A16",
            surface: "#11172A",
            "surface-variant": "#1A2340",
            "on-background": "#F1F4FF",
            "on-surface": "#F1F4FF",
            "on-surface-variant": "#AAB4D0",
            "on-primary": "#FFFFFF",
            "on-secondary": "#241500",
            subtle: "#8FA4FF",
            danger: "#FF7A70",
            error: "#FF7A70",
            success: "#75D6A7",
            warning: "#FFB45C",
            info: "#6DD5FA",
            gray: "#98A2B3",
            grey: "#98A2B3",
        },
      },
    },
  },
  defaults: {
    VTextField: { variant: "outlined", density: "comfortable", color: "secondary" },
    VTextarea: { variant: "outlined", density: "comfortable", color: "secondary" },
    VSelect: { variant: "outlined", density: "comfortable", color: "secondary" },
    VAutocomplete: { variant: "outlined", density: "comfortable", color: "secondary" },
    VCombobox: { variant: "outlined", density: "comfortable", color: "secondary" },
    VFileInput: { variant: "outlined", density: "comfortable", color: "secondary" },
    VBtn: { rounded: "lg" },
    VCard: { rounded: "xl" },
    VChip: { rounded: "lg" },
    VSnackbar: { rounded: "xl" },
  },
  icons: {
    defaultSet: "mds",
    aliases,
    sets: {
      mds,
    },
  },
});

const app = createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .use(errorSnackbarPlugin)
  .component("AppLogo", AppLogo)
  .component("Word", Word)
  .component("Countdown", Countdown)
  .component("LabeledDivider", LabeledDivider)
  .component("ThemeChanger", ThemeChanger)
  .directive("confirm", vConfirm);

app.mount("#app");
