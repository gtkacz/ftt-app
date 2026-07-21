<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn icon variant="text" class="action-btn" v-bind="menuProps" :aria-label="t('language.switchLabel')"
        :title="t('language.switchLabel')">
        <v-icon icon="translate" />
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item v-for="option in options" :key="option.value" :active="option.value === locale"
        @click="localeStore.setLocale(option.value)">
        <v-list-item-title>{{ option.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES } from '@/i18n';
import { useLocaleStore } from '@/stores/locale';

const { t, locale } = useI18n();
const localeStore = useLocaleStore();

const options = computed(() =>
  SUPPORTED_LOCALES.map((value) => ({ value, label: t(`language.${value}`) }))
);
</script>
