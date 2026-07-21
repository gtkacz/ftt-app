import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { i18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth.ts";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: {
      titleKey: "pageTitles.login",
      requiresAuth: false,
    },
  },
  {
    path: "/signup",
    name: "signup",
    component: () => import("@/views/SignUpView.vue"),
    meta: {
      titleKey: "pageTitles.signup",
      requiresAuth: false,
    },
  },
  {
    path: "/draft",
    name: "draft",
    component: () => import("@/views/DraftView.vue"),
  },
  {
    path: "/big-board",
    name: "big-board",
    component: () => import("@/views/BigBoardView.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("@/views/SettingsView.vue"),
  },
  {
    path: "/profile",
    name: "profile",
    component: () => import("@/views/UserView.vue"),
  },
  {
    path: "/lottery",
    name: "lottery",
    component: () => import("@/views/501View.vue"),
  },
  {
    path: "/dashboard/:id",
    name: "dashboard",
    component: () => import("@/views/DashboardView.vue"),
    props: true,
  },
  // Trade Routes
  {
    path: "/trades",
    name: "trade-overview",
    component: () => import("@/views/TradeOverviewView.vue"),
    meta: {
      titleKey: "pageTitles.tradeCenter",
    },
  },
  {
    path: "/trades/create",
    name: "trade-create",
    component: () => import("@/views/TradeEditorView.vue"),
    meta: {
      titleKey: "pageTitles.tradeCreate",
    },
  },
  {
    path: "/trades/:id/edit",
    name: "trade-edit",
    component: () => import("@/views/TradeEditorView.vue"),
    props: true,
    meta: {
      titleKey: "pageTitles.tradeEdit",
    },
  },
  {
    path: "/trades/:id",
    name: "trade-detail",
    component: () => import("@/views/TradeDetailView.vue"),
    props: true,
    meta: {
      titleKey: "pageTitles.tradeDetail",
    },
  },
  {
    path: "/trades/league/history",
    name: "league-trades",
    component: () => import("@/views/LeagueTradeOverviewView.vue"),
    meta: {
      titleKey: "pageTitles.leagueTradeHistory",
    },
  },
  {
    path: "/team/:id",
    name: "team",
    component: () => import("@/views/TeamView.vue"),
    props: true,
  },
  {
    path: "/players",
    name: "players",
    component: () => import("@/views/PlayersView.vue"),
  },
  {
    path: "/league",
    name: "league",
    component: () => import("@/views/501View.vue"),
  },
  {
    path: "/commission",
    component: () => import("@/views/AdminView.vue"),
    meta: {
      requiresStaff: true,
    },
    children: [
      {
        path: "",
        name: "commission",
        redirect: { name: "commission-settings" },
      },
      {
        path: "settings",
        name: "commission-settings",
        component: () => import("@/views/501View.vue"),
        meta: {
          titleKey: "pageTitles.commissionSettings",
          requiresStaff: true,
        },
      },
      {
        path: "users",
        name: "commission-users",
        component: () => import("@/views/admin/UserView.vue"),
        meta: {
          titleKey: "pageTitles.commissionUsers",
          requiresStaff: true,
        },
      },
      {
        path: "teams",
        name: "commission-teams",
        component: () => import("@/views/501View.vue"),
        meta: {
          titleKey: "pageTitles.adminTeams",
          requiresStaff: true,
        },
      },
      {
        path: "players",
        name: "commission-players",
        component: () => import("@/views/501View.vue"),
        meta: {
          titleKey: "pageTitles.adminPlayers",
          requiresStaff: true,
        },
      },
      {
        path: "trades",
        name: "commission-trades",
        component: () => import("@/views/CommissionerTradesView.vue"),
        meta: {
          titleKey: "pageTitles.commissionerTradeReview",
          requiresStaff: true,
        },
      },
    ],
  },
  {
    path: "/league-draft",
    name: "league-draft",
    component: () => import("@/views/LeagueDraftView.vue"),
  },
  {
    path: "/approval",
    name: "approval",
    component: () => import("@/views/WaitForApprovalView.vue"),
  },
  {
    path: "/create-team",
    name: "create-team",
    component: () => import("@/views/TeamCreateView.vue"),
  },
  {
    path: "/unauthorized",
    name: "unauthorized",
    component: () => import("@/views/401View.vue"),
  },
  {
    path: "/not-found",
    name: "not-found",
    component: () => import("@/views/404View.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/not-found",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  const titleKey = to.meta.titleKey as string | undefined;
  document.title = titleKey ? i18n.global.t(titleKey) : i18n.global.t("common.appName");

  const requiresAuth = to.meta.requiresAuth !== false;
  const requiresStaff = to.meta.requiresStaff === true;

  if (requiresAuth) {
    if (authStore.isAuthenticated) {
      try {
        if (!authStore.user) {
          await authStore.refreshAccessToken();
          await authStore.fetchUser();
        }
        if (to.name === "login") {
          next(from.fullPath || "/");
          return;
        }

        if (!authStore.user?.is_approved && to.name !== "approval") {
          next("/approval");
          return;
        }
        if (
          authStore.user?.is_approved &&
          !authStore.user?.team &&
          to.name !== "create-team"
        ) {
          next("/create-team");
          return;
        }
        if (
          authStore.user?.is_approved &&
          !!authStore.user?.team &&
          ["create-team", "approval", "login", "signup"].includes(
            to.name?.toString() || ""
          )
        ) {
          next("/");
          return;
        }
        if (requiresStaff && !authStore.isStaff) {
          next("/unauthorized");
          return;
        }
        next();
      } catch (error) {
        authStore.logout();
        next({
          path: "/login",
          query: { redirect: to.fullPath },
        });
      }
    } else {
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
    }
  } else {
    if (to.name === "login" && authStore.isAuthenticated) {
      next("/");
    } else {
      next();
    }
  }
});

export default router;
