import "@mdi/font/css/materialdesignicons.css";
import "material-symbols";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { md } from "vuetify/iconsets/md";
import { mdi } from "vuetify/iconsets/mdi";
import * as labsComponents from "vuetify/labs/components";
import "vuetify/styles";
import App from "./App.vue";
import { aliases, mds } from "./iconsets/mds";
import router from "./router";

// Vuetify
import "vuetify/styles";

// Custom styles
import "./styles/main.scss";

// Custom plugins
import errorSnackbarPlugin from "@/plugins/errorSnackbar";

// Custom components
import AppLogo from "@/components/common/AppLogo.vue";
import ThemeChanger from "@/components/common/ThemeChanger.vue";
import Word from "@/components/common/Word.vue";
import Countdown from "@/components/common/Countdown.vue";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Detect user's system theme preference
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

const vuetify = createVuetify({
  theme: {
    defaultTheme: prefersDark ? "dark" : "light",
    themes: {
      options: { customProperties: true },
      light: {
        colors: {
          primary: "#0F183E",
          secondary: "#FF9000",
          accent: "#FF9000",
          background: "#FFFFFF",
          surface: "#FFFFFF",
          "surface-variant": "#FFFFFF",
          // 'surface-variant': '#F5F5F5',
          "on-surface": "#0F183E",
          "on-surface-variant": "#0F183E",
          "on-primary": "#FFFFFF",
          "on-secondary": "#FFFFFF",
          subtle: "#191970",
          danger: "#E53935",
          gray: "#36454F",
          grey: "#36454F",
        },
      },
      dark: {
        colors: {
          primary: "#0F183E",
          secondary: "#FF9000",
          accent: "#FF9000",
          background: "#000012",
          surface: "#00001f",
          "surface-variant": "#000017",
          "on-surface": "#FFFFFF",
          "on-surface-variant": "#FFFFFF",
          "on-primary": "#FFFFFF",
          "on-secondary": "#FFFFFF",
          subtle: "#7DF9FF",
          danger: "#E53935",
        },
      },
    },
  },
  components: {
    ...components,
    ...labsComponents,
  },
  directives,
  icons: {
    defaultSet: "mds",
    aliases,
    sets: {
      mds,
      mdi,
      md,
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
  .component("ThemeChanger", ThemeChanger);

app.mount("#app");
