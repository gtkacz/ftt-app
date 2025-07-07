import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
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
    name: 'User',
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
  history: createWebHistory(),
  routes,
})

export default router