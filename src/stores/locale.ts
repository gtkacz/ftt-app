import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { i18n, DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/i18n";
import { detectCountryCode } from "@/services/geolocation";

const STORAGE_KEY = "locale-pref";
type LocaleSource = "user" | "geo" | "browser";

interface LocalePref {
  locale: SupportedLocale;
  source: LocaleSource;
}

/** Countries where Brazilian Portuguese should be the default UI language. */
const PT_BR_COUNTRY_CODES = new Set(["BR"]);

function readSavedPref(): LocalePref | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && isSupportedLocale(parsed.locale)) {
      return parsed as LocalePref;
    }
  } catch {
    // Ignore malformed/inaccessible storage and fall through to detection.
  }
  return null;
}

function guessFromBrowserLanguage(): SupportedLocale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const matchesPortuguese = languages.some((lang) => lang?.toLowerCase().startsWith("pt"));
  return matchesPortuguese ? "pt-BR" : DEFAULT_LOCALE;
}

function applyLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
}

export const useLocaleStore = defineStore("locale", () => {
  const savedPref = readSavedPref();
  const hasUserPref = savedPref?.source === "user";
  const locale = ref<SupportedLocale>(savedPref?.locale ?? guessFromBrowserLanguage());
  const resolving = ref(!hasUserPref);

  watch(locale, applyLocale, { immediate: true });

  function persist(source: LocaleSource) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: locale.value, source }));
  }

  /** Explicit user choice always wins and is never overridden by geo-detection again. */
  function setLocale(next: SupportedLocale) {
    locale.value = next;
    persist("user");
  }

  /**
   * Only an explicit user choice short-circuits detection. A prior geo/browser-guessed
   * default must not get "stuck" forever if the original geo lookup failed transiently.
   */
  async function resolveDefaultLocale() {
    if (hasUserPref) {
      resolving.value = false;
      return;
    }

    const countryCode = await detectCountryCode();
    if (countryCode) {
      locale.value = PT_BR_COUNTRY_CODES.has(countryCode) ? "pt-BR" : DEFAULT_LOCALE;
      persist("geo");
    } else {
      persist("browser");
    }
    resolving.value = false;
  }

  return {
    locale,
    resolving,
    setLocale,
    resolveDefaultLocale,
  };
});
