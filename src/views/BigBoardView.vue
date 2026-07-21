<template>
  <div class="page-view">
    <div class="page-header">
      <h1 class="page-title">{{ t('bigBoardView.title') }}</h1>
      <p class="page-subtitle">{{ t('bigBoardView.subtitle') }}</p>
    </div>

    <div class="coming-soon">
      <v-icon size="80" color="secondary" icon="dashboard" />
      <h2>{{ t('bigBoardView.comingSoonTitle') }}</h2>
      <p>{{ t('bigBoardView.comingSoonDescription') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style lang="scss" scoped></style>