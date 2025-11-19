import { defineStore } from 'pinia';
import { SettingsService } from '@/api/settings';
import type { Settings, SettingsUpdateData } from '@/types/settings';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  lastFetched: number | null;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    settings: null,
    isLoading: false,
    lastFetched: null,
  }),

  actions: {
    /**
     * Fetch settings from API with local storage caching
     * Uses the SettingsService which handles caching internally
     */
    async fetchSettings(forceRefresh = false): Promise<void> {
      if (this.isLoading) return;

      try {
        this.isLoading = true;
        const settings = await SettingsService.getSettings(forceRefresh);
        this.settings = settings;
        this.lastFetched = Date.now();
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Update settings on the backend and in cache
     */
    async updateSettings(data: SettingsUpdateData): Promise<void> {
      if (this.isLoading) return;

      try {
        this.isLoading = true;
        const settings = await SettingsService.updateSettings(data);
        this.settings = settings;
        this.lastFetched = Date.now();
      } catch (error) {
        console.error('Failed to update settings:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Clear settings cache and state
     */
    clearCache(): void {
      SettingsService.clearCache();
      this.settings = null;
      this.lastFetched = null;
    },

    /**
     * Get a specific setting value by key
     */
    getSetting<T = any>(key: string, defaultValue?: T): T | undefined {
      if (!this.settings) return defaultValue;
      return (this.settings[key] as T) ?? defaultValue;
    },
  },

  getters: {
    /**
     * Check if settings are loaded
     */
    isLoaded(): boolean {
      return this.settings !== null;
    },

    /**
     * Check if cache is still valid
     */
    isCacheValid(): boolean {
      return SettingsService.isCacheValid();
    },
  },
});
