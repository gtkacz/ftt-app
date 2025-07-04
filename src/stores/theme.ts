import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useTheme } from 'vuetify'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)
  
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }
  
  return {
    isDark,
    toggleTheme,
  }
})