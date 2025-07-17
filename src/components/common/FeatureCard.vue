<template>
  <v-card class="feature-card" elevation="2">
    <v-card-text class="feature-content">
      <div class="feature-icon">
        <v-icon :icon="icon" size="48" color="secondary" />
      </div>

      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  title: string
  description: string
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
.feature-card {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 12px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
}

.feature-content {
  padding: 32px 24px;
  text-align: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-icon {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-secondary), 0.1);
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
}

.feature-description {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.6;
  font-size: 1rem;
}
</style>