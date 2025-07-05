import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { 
      requiresAuth: false,
      title: 'Home - Fantasy Trash Talk'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { 
      requiresAuth: false,
      title: 'Login - Fantasy Trash Talk'
    }
  },
  {
    path: '/draft',
    name: 'Draft',
    component: () => import('../views/DraftView.vue'),
    meta: { 
      requiresAuth: false,
      title: 'Draft - Fantasy Trash Talk'
    }
  },
  {
    path: '/big-board',
    name: 'BigBoard',
    component: () => import('../views/BigBoardView.vue'),
    meta: { 
      requiresAuth: false,
      title: 'Big Board - Fantasy Trash Talk'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { 
      requiresAuth: false,
      title: 'Settings - Fantasy Trash Talk'
    }
  },
  {
    path: '/user',
    name: 'UserProfile',
    component: () => import('../views/UserView.vue'),
    meta: { 
      requiresAuth: false,
      title: 'User Profile - Fantasy Trash Talk'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: '404 Not Found'
    }
  }
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
  }
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  const title = to.meta.title as string || 'Fantasy Trash Talk';
  document.title = title;

  if (to.meta.requiresAuth) {
    if (authStore.isAuthenticated) {
      try {
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