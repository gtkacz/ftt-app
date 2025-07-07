<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Página não encontrada</h2>
      <p>A página que você está procurando pode ter sido removida ou não está disponível no momento.</p>
      
      <div class="actions">
        <router-link 
          to="/" 
          class="home-button"
        >
          Voltar para a página inicial
        </router-link>
        
        <button 
          @click="goBack" 
          class="back-button"
        >
          Voltar à página anterior
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 2rem;
  text-align: center;
}

.not-found-content {
  max-width: 600px;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 5rem;
  margin: 0;
  color: #dc3545;
  line-height: 1;
}

h2 {
  font-size: 2rem;
  margin-top: 0.5rem;
  color: #343a40;
}

p {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 1.5rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.home-button, .back-button {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.home-button {
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border: none;
}

.home-button:hover {
  background-color: #0056b3;
}

.back-button {
  background-color: white;
  color: #495057;
  border: 1px solid #dee2e6;
}

.back-button:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
}

@media (max-width: 576px) {
  .actions {
    flex-direction: column;
  }
  
  .home-button, .back-button {
    width: 100%;
  }
}
</style>