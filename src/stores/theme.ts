import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useTheme } from "vuetify";

const STORAGE_KEY = "theme";

/** Keep the browser/PWA status bar color in sync with the app background. */
function syncThemeColorMeta(background: string) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = background;
  document.head.appendChild(meta);
}

export const useThemeStore = defineStore("theme", () => {
  const theme = useTheme();
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  // Explicit user choice wins; otherwise follow the system
  const isDark = ref(savedTheme ? savedTheme === "dark" : systemDark.matches);

  const applyTheme = () => {
    theme.change(isDark.value ? "dark" : "light");
    syncThemeColorMeta(theme.current.value.colors.background);
  };

  watch(isDark, applyTheme, { immediate: true });

  systemDark.addEventListener("change", (event) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      isDark.value = event.matches;
    }
  });

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
  };

  return {
    isDark,
    toggleTheme,
  };
});
