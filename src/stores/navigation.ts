import { defineStore } from "pinia";
import { ref } from "vue";

export const useNavigationStore = defineStore("navigation", () => {
  const isNavigationExpanded = ref(false);
  const showNotifications = ref(false);

  const toggleNavigation = () => {
    isNavigationExpanded.value = !isNavigationExpanded.value;
  };

  const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value;
  };

  return {
    isNavigationExpanded,
    showNotifications,
    toggleNavigation,
    toggleNotifications,
  };
});
