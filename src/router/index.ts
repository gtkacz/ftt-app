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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router