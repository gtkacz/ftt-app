<template>
  <div class="page-view">
    <div class="page-header">
      <h1 class="page-title">Player Directory</h1>
      <!-- <p class="page-subtitle">Lorem ipsum dolor sit amet</p> -->
    </div>

    <players-table />
  </div>
</template>

<script setup lang="ts">
import PlayersTable from '../components/core/PlayersTable.vue';
</script>

<style lang="scss" scoped></style>