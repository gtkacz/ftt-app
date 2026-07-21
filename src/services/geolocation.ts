/**
 * IP-based country lookup used only to pick a sensible default locale.
 * Uses a public, key-less geolocation API with a short timeout so a slow/blocked
 * network never delays the app beyond the fallback.
 */
const GEO_LOOKUP_URL = "https://ipwho.is/";
const GEO_LOOKUP_TIMEOUT_MS = 2500;

interface GeoLookupResponse {
  success?: boolean;
  country_code?: string;
}

export async function detectCountryCode(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(GEO_LOOKUP_URL, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }

    const data: GeoLookupResponse = await response.json();
    if (data.success === false || !data.country_code) {
      return null;
    }

    return data.country_code.toUpperCase();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
