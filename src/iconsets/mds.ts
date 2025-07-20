import { h } from "vue";
import type { IconAliases, IconProps, IconSet } from "vuetify";

const aliases: IconAliases = {
  collapse: "keyboard_arrow_up",
  complete: "check",
  cancel: "cancel",
  close: "close",
  delete: "cancel",
  // delete (e.g. v-chip close)
  clear: "cancel",
  success: "check_circle",
  info: "info",
  warning: "priority_high",
  error: "warning",
  prev: "chevron_left",
  next: "chevron_right",
  checkboxOn: "check_box",
  checkboxOff: "check_box_outline_blank",
  checkboxIndeterminate: "indeterminate_check_box",
  delimiter: "fiber_manual_record",
  // for carousel
  sortAsc: "arrow_upward",
  sortDesc: "arrow_downward",
  expand: "keyboard_arrow_down",
  menu: "menu",
  subgroup: "arrow_drop_down",
  dropdown: "arrow_drop_down",
  radioOn: "radio_button_checked",
  radioOff: "radio_button_unchecked",
  edit: "edit",
  ratingEmpty: "star_border",
  ratingFull: "star",
  ratingHalf: "star_half",
  loading: "cached",
  first: "first_page",
  last: "last_page",
  unfold: "unfold_more",
  file: "attach_file",
  plus: "add",
  minus: "remove",
  calendar: "event",
  treeviewCollapse: "arrow_drop_down",
  treeviewExpand: "arrow_right",
  eyeDropper: "colorize",
};

interface ExtendedIconProps extends IconProps {
  variant?: "outlined" | "sharp" | "rounded";
  filled?: boolean | number | "";
  emphasis?: "low" | "default" | "high";
}

const mds: IconSet = {
  component: (props: ExtendedIconProps) => {
    const variantClass = `material-symbols-${props.variant ?? "rounded"}`;
    const emphasisClass = props.emphasis
      ? `material-symbols-${props.emphasis}-emphasis`
      : "material-symbols-default-emphasis";
    const classes = {
      "material-symbols": true,
      [variantClass]: true,
      "material-symbols-filled": props.filled === "" || props.filled || true,
    };
    if (emphasisClass) {
      classes[emphasisClass] = true;
    }
    // Set opsz from fontSize if one is supplied, i.e. by <v-icon size="32" />
    if (props.style?.fontSize) {
      const opsz = parseInt(props.style?.fontSize) || 24;
      props.style["--md-icon-opsz"] = Math.min(Math.max(20, opsz), 48);
    }
    return h(props.tag, {
      ...props,
      class: classes,
      // style: `font-variation-settings: ${fontVariationSettings}`,
      innerHTML: props.icon,
    });
  },
};

export { aliases, mds };
