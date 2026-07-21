import { reactive } from "vue";
import { i18n } from "@/i18n";

interface SnackbarState {
  show: boolean;
  message: string;
  timeout: number;
}

export const errorSnackbar = reactive<SnackbarState>({
  show: false,
  message: "",
  timeout: 6_000,
});

/**
 * Show an error message in the global error snackbar.
 * @param message — the message to display (if null, shows a generic message)
 */
export function showError(...items: (string | Error | null)[]) {
  const text = items
    .map((item) => {
      if (item instanceof Error) {
        return item.message;
      }
      if (typeof item === "string") {
        return item;
      }
      return "";
    })
    .filter((msg) => msg.trim() !== "")
    .join(" ");

  errorSnackbar.show = true;
  errorSnackbar.message = text || i18n.global.t("app.unexpectedError");
  errorSnackbar.timeout = 6_000;
}
