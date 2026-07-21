<template>
  <div class="page-view">
    <div class="page-header">
      <h1 class="page-title">{{ t('draftView.title') }}</h1>
      <p class="page-subtitle">{{ t('draftView.subtitle') }}</p>
    </div>

    <div class="coming-soon">
      <v-icon size="80" color="secondary" icon="assignment" />
      <h2>{{ t('draftView.comingSoonTitle') }}</h2>
      <p>{{ t('draftView.comingSoonDescription') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped></style>