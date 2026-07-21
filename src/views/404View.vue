<template>
  <div class="page-view route-state">
    <div class="route-state__court" aria-hidden="true" />
    <div class="route-state__icon"><v-icon icon="wrong_location" size="36" /></div>
    <p class="eyebrow">{{ t('notFoundView.eyebrow') }}</p>
    <p class="route-state__code">404</p>
    <h1>{{ t('notFoundView.title') }}</h1>
    <p class="route-state__copy">{{ t('notFoundView.description') }}</p>
    <div class="route-state__actions">
      <v-btn :to="{ name: 'home' }" color="secondary" size="large">
        {{ t('notFoundView.returnHome') }}
        <v-icon icon="arrow_forward" end />
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped></style>
