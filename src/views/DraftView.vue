<template>
  <div class="draft-view">
    <div class="page-header">
      <h1 class="page-title">Draft</h1>
      <p class="page-subtitle">Manage your dynasty draft</p>
    </div>

    <div class="coming-soon">
      <v-icon size="80" color="secondary" icon="assignment" />
      <h2>Draft Tools Coming Soon</h2>
      <p>Advanced draft functionality will be available here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Draft view placeholder
</script>

<style lang="scss" scoped>
.draft-view {
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgb(var(--v-theme-on-surface));
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  h2 {
    margin: 24px 0 16px;
    font-size: 1.8rem;
    color: rgb(var(--v-theme-on-surface));
  }

  p {
    color: rgb(var(--v-theme-on-surface));
    font-size: 1.1rem;
  }
}
</style>