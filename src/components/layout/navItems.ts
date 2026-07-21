import { computed } from "vue";
import { i18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth";

export interface NavItemDef {
  icon: string;
  label: string;
  routeName: string;
  params?: Record<string, string | number>;
  commission_only?: boolean;
  disabled?: boolean;
  devonly?: boolean;
}

export interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

// Route names surfaced in the mobile bottom bar; everything else lives in the "More" sheet
export const MOBILE_PRIMARY_ROUTES = ["home", "team", "players", "trade-overview"];

export function useNavigationGroups() {
  const authStore = useAuthStore();
  const { t } = i18n.global;

  return computed<NavGroupDef[]>(() => {
    // Navigation only renders for users with a team, so the fallback is never navigated to
    const teamId = authStore.user?.team?.id ?? "";

    return [
      {
        title: t("nav.groups.general"),
        items: [
          {
            icon: "home",
            label: t("nav.items.home"),
            routeName: "home",
          },
          {
            icon: "dashboard",
            label: t("nav.items.dashboard"),
            routeName: "dashboard",
            params: { id: teamId },
            disabled: !teamId,
          },
          {
            icon: "person_play",
            label: t("nav.items.myTeam"),
            routeName: "team",
            params: { id: teamId },
            disabled: !teamId,
          },
        ],
      },
      {
        title: t("nav.groups.rosters"),
        items: [
          {
            icon: "model_training",
            label: t("nav.items.leagueDraft"),
            routeName: "league-draft",
          },
          {
            icon: "sports_basketball",
            label: t("nav.items.league"),
            routeName: "league",
            disabled: true,
          },
          {
            icon: "clinical_notes",
            label: t("nav.items.players"),
            routeName: "players",
          },
          {
            icon: "handshake",
            label: t("nav.items.trades"),
            routeName: "trade-overview",
          },
        ],
      },
      {
        title: t("nav.groups.draft"),
        items: [
          {
            icon: "workspaces",
            label: t("nav.items.draft"),
            routeName: "draft",
            disabled: true,
          },
          {
            icon: "interests",
            label: t("nav.items.bigBoard"),
            routeName: "big-board",
            disabled: true,
          },
          {
            icon: "format_list_numbered",
            label: t("nav.items.lottery"),
            routeName: "lottery",
            disabled: true,
          },
        ],
      },
      {
        title: t("nav.groups.account"),
        items: [
          {
            icon: "manage_accounts",
            label: t("nav.items.commission"),
            routeName: "commission",
            commission_only: true,
          },
          {
            icon: "settings",
            label: t("nav.items.settings"),
            routeName: "settings",
          },
        ],
      },
    ];
  });
}
