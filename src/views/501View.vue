<template>
  <div class="page-view route-state">
    <div class="route-state__court" aria-hidden="true" />
    <div class="route-state__icon"><v-icon icon="construction" size="36" /></div>
    <p class="eyebrow">{{ t('comingSoonView.eyebrow') }}</p>
    <p class="route-state__code">{{ t('comingSoonView.code') }}</p>
    <h1>{{ t('comingSoonView.title') }}</h1>
    <p class="route-state__copy">{{ t('comingSoonView.description') }}</p>
    <div class="route-state__actions">
      <v-btn :to="{ name: 'home' }" color="secondary" size="large">
        {{ t('comingSoonView.exploreApp') }}
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
