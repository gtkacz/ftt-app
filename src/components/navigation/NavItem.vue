<template>
  <span class="nav-item-content disabled" v-if="disabled" role="link" aria-disabled="true"
    :aria-label="t('navItem.comingSoonWithLabel', { label })" :title="expanded ? t('navItem.comingSoon') : t('navItem.comingSoonWithLabel', { label })">
    <v-icon class="nav-icon" :icon="icon" theme="outlined" />
    <span v-if="expanded" class="nav-item-label">{{ label }}</span>
  </span>
  <router-link :to="to" class="nav-item" custom v-slot="{ href, navigate, isActive }"
    v-else-if="!commission_only || user?.is_staff">
    <a :href="href" class="nav-item-content" :class="{ active: isActive, expanded }" :title="expanded ? undefined : label"
      :aria-label="label" :aria-current="isActive ? 'page' : undefined" @click="navigate">
      <v-icon class="nav-icon" :icon="icon" theme="outlined" />
      <transition name="fade">
        <span v-if="expanded" class="nav-item-label">{{ label }}</span>
      </transition>
    </a>
  </router-link>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

interface Props {
  icon: string
  label: string
  to: RouteLocationRaw
  expanded: boolean,
  commission_only?: boolean
  disabled?: boolean
}

defineProps<Props>()
const { t } = useI18n()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
</script>

<style lang="scss" scoped></style>
