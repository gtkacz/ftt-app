/**
 * Application settings structure
 * Extend this interface as backend settings are defined
 */
export interface Settings {
  // Add your actual settings properties here based on backend response
  // Example properties:
  theme?: 'light' | 'dark' | 'auto';
  notifications_enabled?: boolean;
  language?: string;
  [key: string]: any; // Allow additional dynamic properties
}

/**
 * Cache metadata for settings
 */
export interface SettingsCache {
  data: Settings;
  expiry: number;
}

/**
 * Settings update payload
 */
export type SettingsUpdateData = Partial<Settings>;
