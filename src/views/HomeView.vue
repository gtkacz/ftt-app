<template>
  <div class="home-view">
    <div class="welcome-container">
      <div class="welcome-content">
        <div class="welcome-icon">
          <app-logo size="288px" class="animate__animated animate__fadeInDown" />
        </div>

        <h1 class="welcome-title animate__animated animate__fadeInUp">
          Welcome to <span class="highlight">Fantasy Trash Talk</span>, {{ user.first_name || 'Guest' }}!
        </h1>

        <!-- <p class="welcome-subtitle animate__animated animate__fadeIn">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit
        </p> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
</script>

<style lang="scss" scoped>
.home-view {
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
}

.welcome-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, rgba(15, 24, 62, 0.05) 0%, rgba(255, 144, 0, 0.05) 100%);
  border-radius: 16px;
  margin-bottom: 40px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.welcome-icon {
  margin-bottom: 32px;

  img {
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.welcome-title {
  font-size: 3rem;
  font-weight: normal;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  line-height: 1.2;

  .highlight {
    color: rgb(var(--v-theme-secondary));
    font-weight: bolder;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 40px;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
}
</style>