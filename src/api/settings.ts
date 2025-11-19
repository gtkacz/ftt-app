import api from './axios';
import type { Settings, SettingsUpdateData } from '@/types/settings';

const SETTINGS_CACHE_KEY = 'app_settings';
const CACHE_EXPIRY_KEY = 'app_settings_expiry';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache duration

export const SettingsService = {
  /**
   * Fetch settings from API with local storage caching
   * Returns cached data if available and not expired, otherwise fetches from API
   */
  async getSettings(forceRefresh = false): Promise<Settings> {
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cachedSettings = this.getCachedSettings();
      if (cachedSettings) {
        return cachedSettings;
      }
    }

    // Fetch from API
    const response = await api.get('/settings/');
    const settings = response.data;

    // Cache the response
    this.cacheSettings(settings);

    return settings;
  },

  /**
   * Update settings on the backend and update local cache
   */
  async updateSettings(data: SettingsUpdateData): Promise<Settings> {
    const response = await api.patch('/settings/', data);
    const settings = response.data;

    // Update cache with new settings
    this.cacheSettings(settings);

    return settings;
  },

  /**
   * Get settings from local storage cache
   * Returns null if cache is expired or doesn't exist
   */
  getCachedSettings(): Settings | null {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

      if (!cached || !expiry) {
        return null;
      }

      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();

      // Check if cache is expired
      if (now > expiryTime) {
        this.clearCache();
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Error reading settings from cache:', error);
      this.clearCache();
      return null;
    }
  },

  /**
   * Cache settings in local storage with expiry time
   */
  cacheSettings(settings: Settings): void {
    try {
      const expiry = Date.now() + CACHE_DURATION;
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
      localStorage.setItem(CACHE_EXPIRY_KEY, expiry.toString());
    } catch (error) {
      console.error('Error caching settings:', error);
    }
  },

  /**
   * Clear settings cache from local storage
   */
  clearCache(): void {
    localStorage.removeItem(SETTINGS_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  },

  /**
   * Check if cache exists and is valid
   */
  isCacheValid(): boolean {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry) return false;

    const expiryTime = parseInt(expiry, 10);
    return Date.now() <= expiryTime;
  },
};
