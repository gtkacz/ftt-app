import { createVNode, render, type AppContext, createApp } from "vue";
import ConfirmDialog from "./ConfirmDialog.vue";

export interface ConfirmOptions {
  title?: string;
  text?: string;
}

export function showConfirm(
  opts: ConfirmOptions = {},
  appContext?: AppContext
): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a detached container
    const container = document.createElement("div");
    document.body.appendChild(container);

    // Create component props
    const props = {
      title: opts.title || "Confirm",
      text: opts.text || "Are you sure?",
      onConfirm() {
        cleanup();
        resolve(true);
      },
      onCancel() {
        cleanup();
        resolve(false);
      },
    };

    function cleanup() {
      render(null, container);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }

    // Create vnode with proper context
    const vnode = createVNode(ConfirmDialog, props);

    // IMPORTANT: Ensure appContext is properly set
    if (appContext) {
      vnode.appContext = appContext;
    } else {
      console.error(
        "No appContext provided to showConfirm. Vuetify components will not work."
      );
      cleanup();
      resolve(false);
      return;
    }

    // Render the vnode
    render(vnode, container);
  });
}
