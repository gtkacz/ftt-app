<template>
  <nav class="bottom-nav" aria-label="Primary">
    <button v-for="item in primaryItems" :key="item.routeName" type="button" class="bottom-nav__item"
      :class="{ active: isItemActive(item) }" :aria-label="item.label"
      :aria-current="isItemActive(item) ? 'page' : undefined" @click="go(item)">
      <span class="bottom-nav__icon">
        <v-icon :icon="item.icon" size="24" />
      </span>
      <span class="bottom-nav__label">{{ item.label }}</span>
    </button>

    <button type="button" class="bottom-nav__item" :class="{ active: sheet }" aria-label="More navigation"
      :aria-expanded="sheet" @click="sheet = true">
      <span class="bottom-nav__icon">
        <v-icon icon="apps" size="24" />
      </span>
      <span class="bottom-nav__label">More</span>
    </button>
  </nav>

  <v-bottom-sheet v-model="sheet">
    <v-card rounded="t-xl" class="more-sheet">
      <div class="more-sheet__handle" />

      <template v-for="group in sheetGroups" :key="group.title">
        <v-list v-if="group.items.length" density="comfortable" class="more-sheet__list" bg-color="transparent">
          <v-list-subheader>{{ group.title }}</v-list-subheader>
          <v-list-item v-for="item in group.items" :key="item.routeName" :disabled="item.disabled" rounded="lg"
            :active="isItemActive(item)" color="secondary" @click="go(item)">
            <template #prepend>
              <v-icon :icon="item.icon" />
            </template>
            <v-list-item-title>{{ item.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </template>

      <div class="more-sheet__footer">
        <a href="https://github.com/gtkacz/ftt-app" target="_blank">v{{ version }}</a>
      </div>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MOBILE_PRIMARY_ROUTES, useNavigationGroups } from '@/components/layout/navItems'
import type { NavItemDef } from '@/components/layout/navItems'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const navigationGroups = useNavigationGroups()
const version = __APP_VERSION__
const isDev = import.meta.env.DEV

const sheet = ref(false)

// Short labels fit the bottom bar better than the full nav names
const SHORT_LABELS: Record<string, string> = {
  team: 'Team',
  'trade-overview': 'Trades',
}

const allItems = computed(() => navigationGroups.value.flatMap((group) => group.items))

const primaryItems = computed(() =>
  MOBILE_PRIMARY_ROUTES.map((routeName) => {
    const item = allItems.value.find((candidate) => candidate.routeName === routeName)
    return item ? { ...item, label: SHORT_LABELS[routeName] ?? item.label } : null
  }).filter((item): item is NavItemDef => item !== null),
)

const sheetGroups = computed(() =>
  navigationGroups.value
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => !MOBILE_PRIMARY_ROUTES.includes(item.routeName))
        .filter((item) => !item.commission_only || authStore.isStaff)
        .map((item) => ({
          ...item,
          disabled: (item.disabled || (item.devonly && !isDev)) ?? false,
        })),
    }))
    .filter((group) => group.items.length > 0),
)

function isItemActive(item: NavItemDef): boolean {
  const name = route.name?.toString() ?? ''
  if (item.routeName === 'trade-overview') {
    return name.startsWith('trade')
  }
  if (item.routeName === 'commission') {
    return name.startsWith('commission')
  }
  return name === item.routeName
}

function go(item: NavItemDef) {
  if (item.disabled) {
    return
  }
  sheet.value = false
  router.push({ name: item.routeName, params: item.params || {} })
}
</script>

<style lang="scss" scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1006;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  align-items: stretch;
  height: calc(#{$bottom-nav-height} + env(safe-area-inset-bottom));
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
  background-color: rgba(var(--v-theme-surface), 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 -12px 34px rgba(7, 10, 22, 0.08);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  background: none;
  padding: 0;
  color: rgba(var(--v-theme-on-surface), 0.65);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s ease;
  min-width: 0;
  min-height: 48px;

  &:active .bottom-nav__icon {
    transform: scale(0.9);
  }

  &.active {
    color: rgb(var(--v-theme-secondary));

    .bottom-nav__icon {
      background-color: rgba(var(--v-theme-secondary), 0.16);
      // Material Symbols renders the filled glyph when FILL=1
      --md-icon-fill: 1;
    }
  }
}

.bottom-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 30px;
  border-radius: 15px;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.bottom-nav__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.more-sheet {
  width: min(100%, 560px);
  margin: 0 auto;
  padding: 4px 12px calc(12px + env(safe-area-inset-bottom));
  max-height: 70dvh;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-bottom: 0;

  // v-card is a flex column — without this the lists shrink and overlap when content
  // exceeds max-height instead of letting the card scroll
  > * {
    flex-shrink: 0;
  }
}

.more-sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  margin: 8px auto 4px;
  background-color: rgba(var(--v-theme-on-surface), 0.2);
}

.more-sheet__list {
  padding: 0;
}

.more-sheet__footer {
  padding: 12px 16px 4px;
  text-align: center;
  font-size: 12px;

  a {
    color: rgba(var(--v-theme-on-surface), 0.4);
    text-decoration: none;
  }
}

@media (max-width: 360px) {
  .bottom-nav__icon {
    width: 48px;
  }

  .bottom-nav__label {
    font-size: 10px;
  }
}
</style>
