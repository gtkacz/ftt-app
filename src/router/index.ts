import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
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
      title: "Login - Fantasy Trash Talk",
      requiresAuth: false,
    },
  },
  {
    path: "/signup",
    name: "signup",
    component: () => import("@/views/SignUpView.vue"),
    meta: {
      title: "Signup - Fantasy Trash Talk",
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
  {
    path: "/trade",
    name: "trade",
    component: () => import("@/views/501View.vue"),
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
    path: "/trades",
    name: "trades",
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
          title: "Commission Settings - Fantasy Trash Talk",
          requiresStaff: true,
        },
      },
      {
        path: "users",
        name: "commission-users",
        component: () => import("@/views/admin/UserView.vue"),
        meta: {
          title: "Comission Users - Fantasy Trash Talk",
          requiresStaff: true,
        },
      },
      {
        path: "teams",
        name: "commission-teams",
        component: () => import("@/views/501View.vue"),
        meta: {
          title: "Admin Teams - Fantasy Trash Talk",
          requiresStaff: true,
        },
      },
      {
        path: "players",
        name: "commission-players",
        component: () => import("@/views/501View.vue"),
        meta: {
          title: "Admin Players - Fantasy Trash Talk",
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

  const title = (to.meta.title as string) || "Fantasy Trash Talk";
  document.title = title;

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
          ["create-team", "approval", "login", "signup"].includes(to.name?.toString() || "")
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
