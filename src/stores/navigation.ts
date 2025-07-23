import { defineStore } from "pinia";
import { ref } from "vue";

export const useNavigationStore = defineStore("navigation", () => {
  const isNavigationExpanded = ref(false);

  const toggleNavigation = () => {
    console.log("Toggling navigation");
    isNavigationExpanded.value = !isNavigationExpanded.value;
  };

  return {
    isNavigationExpanded,
    toggleNavigation,
  };
});
