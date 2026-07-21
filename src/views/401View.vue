<template>
  <div class="page-view route-state">
    <div class="route-state__court" aria-hidden="true" />
    <div class="route-state__icon"><v-icon icon="lock" size="36" /></div>
    <p class="eyebrow">Restricted area</p>
    <p class="route-state__code">401</p>
    <h1>That play is off limits</h1>
    <p class="route-state__copy">Your account does not have permission to open this workspace.</p>
    <div class="route-state__actions">
      <v-btn :to="{ name: 'home' }" color="secondary" size="large">
        Back to home
        <v-icon icon="arrow_forward" end />
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped></style>
