<template>
  <div class="page-view route-state">
    <div class="route-state__court" aria-hidden="true" />
    <div class="route-state__icon"><v-icon icon="construction" size="36" /></div>
    <p class="eyebrow">In the locker room</p>
    <p class="route-state__code">Soon</p>
    <h1>This feature is warming up</h1>
    <p class="route-state__copy">The route is reserved, but the experience is still being built.</p>
    <div class="route-state__actions">
      <v-btn :to="{ name: 'home' }" color="secondary" size="large">
        Explore the app
        <v-icon icon="arrow_forward" end />
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped></style>
