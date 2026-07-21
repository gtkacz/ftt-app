import { computed } from "vue";
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

  return computed<NavGroupDef[]>(() => {
    // Navigation only renders for users with a team, so the fallback is never navigated to
    const teamId = authStore.user?.team?.id ?? "";

    return [
      {
        title: "General",
        items: [
          {
            icon: "home",
            label: "Home",
            routeName: "home",
          },
          {
            icon: "dashboard",
            label: "Dashboard",
            routeName: "dashboard",
            params: { id: teamId },
            disabled: !teamId,
          },
          {
            icon: "person_play",
            label: "My Team",
            routeName: "team",
            params: { id: teamId },
            disabled: !teamId,
          },
        ],
      },
      {
        title: "Rosters",
        items: [
          {
            icon: "model_training",
            label: "League Draft",
            routeName: "league-draft",
          },
          {
            icon: "sports_basketball",
            label: "League",
            routeName: "league",
            disabled: true,
          },
          {
            icon: "clinical_notes",
            label: "Players",
            routeName: "players",
          },
          {
            icon: "handshake",
            label: "Trades",
            routeName: "trade-overview",
          },
        ],
      },
      {
        title: "Draft",
        items: [
          {
            icon: "workspaces",
            label: "Draft",
            routeName: "draft",
            disabled: true,
          },
          {
            icon: "interests",
            label: "Big Board",
            routeName: "big-board",
            disabled: true,
          },
          {
            icon: "format_list_numbered",
            label: "Lottery",
            routeName: "lottery",
            disabled: true,
          },
        ],
      },
      {
        title: "Account",
        items: [
          {
            icon: "manage_accounts",
            label: "Commission",
            routeName: "commission",
            commission_only: true,
          },
          {
            icon: "settings",
            label: "Settings",
            routeName: "settings",
          },
        ],
      },
    ];
  });
}
