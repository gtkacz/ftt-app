/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
import { User } from "./types/auth.ts";

declare global {
  const __APP_VERSION__: string;
  const __BUILD_TIME__: string;
  const user: User | null;
}

export {};
