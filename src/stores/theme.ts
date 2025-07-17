import { defineStore } from "pinia";
import { ref } from "vue";
import { useTheme } from "vuetify";
import { onMounted } from "vue";

export const useThemeStore = defineStore("theme", () => {
  const theme = useTheme();
  const isDark = ref(localStorage.getItem("theme") === "dark");

  onMounted(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      isDark.value = savedTheme === "dark";
      theme.change(isDark.value ? "dark" : "light");
    } else {
      theme.change("light");
    }
  });

  const toggleTheme = () => {
    isDark.value = !isDark.value;
    theme.change(isDark.value ? "dark" : "light");
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  };

  return {
    isDark,
    toggleTheme,
  };
});
