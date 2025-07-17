import { defineStore } from "pinia";
import { ref } from "vue";
import { useTheme } from "vuetify";


export const useThemeStore = defineStore("theme", () => {
  const theme = useTheme();
  const isDark = ref(false);

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    theme.change(isDark.value ? "light" : "dark");
  };

  return {
    isDark,
    toggleTheme,
  };
});
