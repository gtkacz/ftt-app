<template>
  <div class="page-view route-state">
    <div class="route-state__court" aria-hidden="true" />
    <div class="route-state__icon"><v-icon icon="wrong_location" size="36" /></div>
    <p class="eyebrow">Out of bounds</p>
    <p class="route-state__code">404</p>
    <h1>This page left the court</h1>
    <p class="route-state__copy">The link may be outdated, or the page may have moved somewhere else.</p>
    <div class="route-state__actions">
      <v-btn :to="{ name: 'home' }" color="secondary" size="large">
        Return home
        <v-icon icon="arrow_forward" end />
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped></style>
