<template>
  <div class="app-layout">
    <div v-if="isDev" class="dev-indicator" :class="{ 'above-bottom-nav': showNavigation && mobile }"
      :aria-label="t('appLayout.devIndicator.ariaLabel')">
      <span class="dev-indicator__dot" aria-hidden="true" />
      {{ t('appLayout.devIndicator.label') }}
    </div>

    <AppNavigation v-if="hasDesktopNavigation" />

    <AppTopBar v-if="showTopBar" :with-navigation="hasDesktopNavigation" />

    <main class="main-content" :class="{
      'public-content': !showTopBar,
      'has-top-bar': showTopBar,
      'has-desktop-navigation': hasDesktopNavigation,
      'has-bottom-nav': showNavigation && mobile,
    }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <AppBottomNav v-if="showNavigation && mobile" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import AppBottomNav from '@/components/layout/AppBottomNav.vue';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import AppTopBar from '@/components/layout/AppTopBar.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const route = useRoute();
const { mobile } = useDisplay();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const isApproved = computed(() => authStore.isApproved);
const hasTeam = computed(() => !!authStore.user?.team);
const showNavigation = computed(() => isAuthenticated.value && isApproved.value && hasTeam.value);
const hasDesktopNavigation = computed(() => showNavigation.value && !mobile.value);
const isOnboardingRoute = computed(() => ['approval', 'create-team'].includes(String(route.name ?? '')));
const showTopBar = computed(() => isAuthenticated.value && !isOnboardingRoute.value);
const isDev = import.meta.env.DEV;
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: clamp(20px, 2.5vw, 36px);
  background: rgb(var(--v-theme-background));
  -webkit-overflow-scrolling: touch;

  &.has-top-bar {
    margin-top: calc(#{$top-bar-height} + env(safe-area-inset-top));
  }

  &.has-desktop-navigation {
    margin-left: $navigation-rail-width;
  }

  &.public-content {
    padding: 0;
  }

  @media (max-width: #{$breakpoint-md - 1px}) {
    &.has-top-bar {
      margin-top: calc(#{$top-bar-height-mobile} + env(safe-area-inset-top));
    }

    &:not(.public-content) {
      padding: 18px;
      padding-left: max(18px, env(safe-area-inset-left));
      padding-right: max(18px, env(safe-area-inset-right));
    }

    &.has-bottom-nav {
      padding-bottom: calc(24px + #{$bottom-nav-height} + env(safe-area-inset-bottom));
    }
  }
}

.dev-indicator {
  position: fixed;
  right: max(12px, env(safe-area-inset-right));
  bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 1100;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 999px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-surface), 0.9);
  box-shadow: $shadow-sm;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  pointer-events: none;
  backdrop-filter: blur(12px);
  opacity: 0.86;

  &.above-bottom-nav {
    bottom: calc(#{$bottom-nav-height} + 12px + env(safe-area-inset-bottom));
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgb(var(--v-theme-info));
    box-shadow: 0 0 0 3px rgba(var(--v-theme-info), 0.14);
  }
}
</style>
