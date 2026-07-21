import { i18n } from "@/i18n";

const GIS_SRC = "https://accounts.google.com/gsi/client";

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  width?: number;
  logo_alignment?: "left" | "center";
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
  prompt: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

let loadPromise: Promise<GoogleAccountsId> | null = null;

/**
 * Load the Google Identity Services script once and resolve with its
 * `google.accounts.id` API. Subsequent calls reuse the same in-flight promise.
 */
export function loadGoogleIdentity(locale?: string): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (loadPromise) {
    return loadPromise;
  }

  // Google reads the button/prompt display language from this script's `hl` query
  // param at load time; it can't be changed afterward without reloading the script.
  const src = locale ? `${GIS_SRC}?hl=${encodeURIComponent(locale)}` : GIS_SRC;

  loadPromise = new Promise<GoogleAccountsId>((resolve, reject) => {
    const settle = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error(i18n.global.t("googleIdentity.unavailable")));
      }
    };

    const fail = () => {
      loadPromise = null;
      reject(new Error(i18n.global.t("googleIdentity.loadFailed")));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );

    if (existing) {
      existing.addEventListener("load", settle);
      existing.addEventListener("error", fail);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = settle;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return loadPromise;
}
