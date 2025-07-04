<template>
  <div class="home-view">
    <div class="welcome-container">
      <div class="welcome-content">
        <div class="welcome-icon">
          <v-icon size="120" color="secondary">mdi-basketball</v-icon>
        </div>
        
        <h1 class="welcome-title">
          Welcome to <span class="highlight">NBA Dynasty Fantasy</span>
        </h1>
        
        <p class="welcome-subtitle">
          Build your dynasty, draft the future, and dominate the league
        </p>
        
        <div class="welcome-actions">
          <v-btn
            size="large"
            color="secondary"
            variant="elevated"
            @click="navigateToDraft"
            class="action-btn"
          >
            <v-icon left>mdi-clipboard-text</v-icon>
            Start Draft
          </v-btn>
          
          <v-btn
            size="large"
            color="primary"
            variant="outlined"
            @click="navigateToBigBoard"
            class="action-btn"
          >
            <v-icon left>mdi-view-dashboard</v-icon>
            View Big Board
          </v-btn>
        </div>
      </div>
    </div>
    
    <div class="features-grid">
      <FeatureCard
        icon="mdi-account-group"
        title="Dynasty Management"
        description="Build and manage your long-term dynasty roster with strategic depth"
      />
      
      <FeatureCard
        icon="mdi-clipboard-text"
        title="Advanced Draft Tools"
        description="Comprehensive draft board with real-time updates and analytics"
      />
      
      <FeatureCard
        icon="mdi-chart-line"
        title="Player Analytics"
        description="Deep dive into player statistics and performance metrics"
      />
      
      <FeatureCard
        icon="mdi-trophy"
        title="Championship Ready"
        description="Tools and insights to help you win your dynasty league"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import FeatureCard from '../components/common/FeatureCard.vue'

const router = useRouter()

const navigateToDraft = () => {
  router.push({ name: 'Draft' })
}

const navigateToBigBoard = () => {
  router.push({ name: 'BigBoard' })
}
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
  opacity: 0.8;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
  line-height: 1.2;
  
  .highlight {
    color: rgb(var(--v-theme-secondary));
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 40px;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
}

.welcome-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 40px;
}
</style>