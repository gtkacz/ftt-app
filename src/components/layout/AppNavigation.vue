<template>
  <nav class="app-navigation" :class="{ expanded: isExpanded }" :aria-label="t('appNavigation.ariaLabel')"
    @mouseenter="isHovered = true" @mouseleave="isHovered = false" @focusin="isFocusWithin = true"
    @focusout="handleFocusOut">
    <div class="nav-logo">
      <LogoNav :label="t('common.appName')" :expanded="isExpanded" />
    </div>

    <div class="nav-items">
      <div v-for="(group, index) in navigationGroups" :key="index" class="nav-group">
        <div>
          <div class="nav-group-header" :class="{ expanded: isExpanded }" aria-hidden="true">
            <div v-if="isExpanded" class="nav-group-title hovered">{{ group.title }}</div>
            <div class="nav-divider" :class="{ expanded: isExpanded }"></div>
          </div>

          <NavItem v-for="item in group.items" :key="item.routeName" :icon="item.icon" :label="item.label"
            :to="{ name: item.routeName, params: item.params || {} }" :expanded="isExpanded"
            :commission_only="item.commission_only ?? false"
            :disabled="(item.disabled || (item.devonly && !isDev)) ?? false" />
        </div>
      </div>
    </div>
    <div v-if="isExpanded" class="nav-footer">
      <a href="https://github.com/gtkacz/ftt-app" target="_blank" rel="noreferrer">v{{ version }}</a>
    </div>
  </nav>
</template>

<script setup lang="ts">
import NavItem from '@/components/navigation/NavItem.vue'
import LogoNav from '@/components/navigation/LogoNav.vue'
import { useNavigationGroups } from '@/components/layout/navItems'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const version = __APP_VERSION__
const isDev = ref(import.meta.env.DEV);
const navigationGroups = useNavigationGroups()

const isHovered = ref(false)
const isFocusWithin = ref(false)
const isExpanded = computed(() => isHovered.value || isFocusWithin.value)

function handleFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget as Node | null
  if (!nextTarget || !(event.currentTarget as HTMLElement).contains(nextTarget)) {
    isFocusWithin.value = false
  }
}
</script>

<style lang="scss" scoped>
.app-navigation {
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  width: $navigation-rail-width;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1005;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  justify-content: flex-start;

  &>* {
    width: 100%;
  }

  &.expanded {
    width: 240px;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  min-height: calc(#{$top-bar-height} + env(safe-area-inset-top));
  margin-bottom: 10px;
  padding: calc(12px + env(safe-area-inset-top)) 8px 12px;
  position: relative;
  justify-content: center;
  gap: 16px;
}

.nav-items {
  flex: 1;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-header {
  position: relative;
  height: 22px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;

  &.expanded {
    align-items: inherit;
  }
}

.nav-group-title {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 16px;
  opacity: 0;
  transition: opacity 0.1s ease;
  background-color: rgb(var(--v-theme-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.hovered {
    opacity: 1;
    z-index: 999;
  }
}

.nav-divider {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 1px;
  width: calc(100% - 32px);
  background-color: rgba(255, 255, 255, 0.1);
  transition: width 0.1s ease;

  &.expanded {
    right: 0;
    margin-right: 3px;
  }
}

.nav-footer {
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  justify-content: center;
  font-size: 0.68rem;
  padding: 12px 16px max(12px, env(safe-area-inset-bottom));
  display: inline-flex;

  & a {
    text-decoration: none;
    color: inherit;
  }
}
</style>
