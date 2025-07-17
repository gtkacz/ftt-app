<template>
  <div class="page-view">
    <!-- <div class="page-header">
      <h1 class="page-title">League</h1>
      <p class="page-subtitle">Lorem ipsum dolor sit amet</p>
    </div> -->
    
    <players-table />
  </div>
</template>

<script setup lang="ts">
import PlayersTable from '../components/core/PlayersTable.vue';
</script>

<style lang="scss" scoped>
.page-view {
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
</style>