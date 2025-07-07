import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      title: 'Login - Fantasy Trash Talk',
      requiresAuth: false,
    },
  },
  {
    path: '/draft',
    name: 'Draft',
    component: () => import('../views/DraftView.vue'),
  },
  {
    path: '/big-board',
    name: 'BigBoard',
    component: () => import('../views/BigBoardView.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
  },
  {
    path: '/user',
    name: 'UserProfile',
    component: () => import('../views/UserView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/trade',
    name: 'trade',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/team',
    name: 'team',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/free-agency',
    name: 'free-agency',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/league',
    name: 'league',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/trades',
    name: 'trades',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/501View.vue'),
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('../views/401View.vue'),
  },
  {
    path: '/not-found',
    name: 'not-found',
    component: () => import('../views/404View.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found',
  },
  {
    path: '/:pathMatch(.*)',
    redirect: '/not-found',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  const title = to.meta.title as string || 'Fantasy Trash Talk';
  document.title = title;

  if (typeof to.meta.requiresAuth !== 'undefined' ? to.meta.requiresAuth : true) {
    if (authStore.isAuthenticated) {
      try {
        if (to.meta.requiresStaff && !authStore.isStaff) {
          next('/unauthorized');
          return;
        }
        next();
      } catch (error) {
        authStore.logout();
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        });
      }
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    }
  } else {
    if (to.name === 'Login' && authStore.isAuthenticated) {
      next('/');
    } else {
      next();
    }
  }
});

export default router;