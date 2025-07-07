import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue'),
    meta: { 
      requiresAuth: true,
      requiresStaff: true //CRIEI ESSA ROTA/COMPONENTE SO PRA TESTAR A FLAG!
    }
  },
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
    path: '/404',
    name: '404',
    component: () => import('../views/404View.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
  {
    path: '/:pathMatch(.*)',
    redirect: '/404',
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

  if (to.meta.requiresAuth) {
    if (authStore.isAuthenticated) {
      try {
        // if (to.meta.requiresStaff && !authStore.isStaff) {
        //   next('/unauthorized'); ***** DESCOMENTA ISSO QUANDO TIVER A ROTA/PAGINA DE /unauthorized
        //   return;
        // }
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