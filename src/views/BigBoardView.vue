<template>
  <div class="big-board-view">
    <div class="page-header">
      <h1 class="page-title">Big Board</h1>
      <p class="page-subtitle">Player rankings and analytics</p>
    </div>
    
    <div class="coming-soon">
      <v-icon size="80" color="secondary">mdi-view-dashboard</v-icon>
      <h2>Big Board Coming Soon</h2>
      <p>Comprehensive player rankings and analytics will be available here</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Big Board view placeholder
</script>

<style lang="scss" scoped>
.big-board-view {
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
  color: rgb(var(--v-theme-on-surface-variant));
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
    color: rgb(var(--v-theme-on-surface-variant));
    font-size: 1.1rem;
  }
}
</style>