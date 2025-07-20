// src/directives/v-confirm.ts
import { Directive, VNode, DirectiveBinding } from "vue";
import { showConfirm, ConfirmOptions } from "./useConfirm.ts";

interface ElWithHandler extends HTMLElement {
  __vConfirmHandler?: EventListener;
}

export const vConfirm: Directive<HTMLElement, string | ConfirmOptions> = {
  mounted(
    el: ElWithHandler,
    binding: DirectiveBinding<string | ConfirmOptions>,
    vnode: VNode
  ) {
    // Create the confirm handler that intercepts in capture phase
    const confirmHandler = async (evt: Event) => {
      // Stop the event from reaching Vue's handler
      evt.stopImmediatePropagation();
      evt.preventDefault();

      // Build confirm options
      const opts: ConfirmOptions =
        typeof binding.value === "string"
          ? { text: binding.value }
          : binding.value || {};

      // Get the app context from the binding's instance
      const instance = binding.instance;
      const appContext = instance?.$?.appContext || instance?.$.ctx?.appContext;

      if (!appContext) {
        console.error("Could not find app context for v-confirm directive");
        return;
      }

      // Show dialog with correct Vuetify context
      const ok = await showConfirm(opts, appContext);

      // If confirmed, manually trigger a new click event that Vue will handle
      if (ok) {
        // Create a new event that won't be caught by our handler
        const newEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });

        // Temporarily remove our handler to let the event through
        el.removeEventListener("click", confirmHandler, true);

        // Dispatch the event
        el.dispatchEvent(newEvent);

        // Re-add our handler
        el.addEventListener("click", confirmHandler, true);
      }
    };

    el.__vConfirmHandler = confirmHandler;
    // Add listener in capture phase to intercept before Vue's handlers
    el.addEventListener("click", confirmHandler, true);
  },

  unmounted(el: ElWithHandler) {
    // Remove our handler
    if (el.__vConfirmHandler) {
      el.removeEventListener("click", el.__vConfirmHandler, true);
      delete el.__vConfirmHandler;
    }
  },
};
