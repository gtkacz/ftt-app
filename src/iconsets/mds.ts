import { h } from "vue";
import type { CSSProperties } from "vue";
import type { IconAliases, IconProps, IconSet } from "vuetify";
import { materialSymbolCodepoints } from "./material-symbol-codepoints";

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
  upload: "upload",
  color: "palette",
  command: "keyboard_command_key",
  ctrl: "keyboard_control_key",
  space: "space_bar",
  shift: "shift",
  alt: "keyboard_option_key",
  enter: "keyboard_return",
  arrowup: "arrow_upward",
  arrowdown: "arrow_downward",
  arrowleft: "arrow_back",
  arrowright: "arrow_forward",
  backspace: "backspace",
};

interface ExtendedIconProps extends IconProps {
  variant?: "outlined" | "sharp" | "rounded";
  filled?: boolean | number | "";
  emphasis?: "low" | "default" | "high";
  style?: CSSProperties & { "--md-icon-opsz"?: number };
}

const mds: IconSet = {
  component: (props: ExtendedIconProps) => {
    const variantClass = `material-symbols-${props.variant ?? "rounded"}`;
    const emphasisClass = props.emphasis
      ? `material-symbols-${props.emphasis}-emphasis`
      : "material-symbols-default-emphasis";
    const isFilled =
      props.filled === "" || props.filled === true || props.filled === 1;
    const classes = {
      "material-symbols": true,
      [variantClass]: true,
      "material-symbols-filled": isFilled,
    };
    if (emphasisClass) {
      classes[emphasisClass] = true;
    }
    const iconName = String(props.icon);
    const glyph = materialSymbolCodepoints[iconName] ?? materialSymbolCodepoints.help;

    if (import.meta.env.DEV && !materialSymbolCodepoints[iconName]) {
      console.warn(`[icons] Missing Material Symbol subset entry: ${iconName}`);
    }
    // Set opsz from fontSize if one is supplied, i.e. by <v-icon size="32" />
    const style = props.style ? { ...props.style } : undefined;
    if (style?.fontSize) {
      const opsz = parseInt(String(style.fontSize)) || 24;
      style["--md-icon-opsz"] = Math.min(Math.max(20, opsz), 48);
    }
    return h(props.tag, {
      ...props,
      class: classes,
      style,
      "data-icon": iconName,
    }, glyph);
  },
};

export { aliases, mds };
