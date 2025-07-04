<template>
  <div class="app-logo">
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" fill="#FF9000" stroke="#FFFFFF" stroke-width="2"/>
      <path
        d="M15 12h10c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H15c-1.1 0-2-.9-2-2V14c0-1.1.9-2 2-2z"
        fill="#FFFFFF"
      />
      <path
        d="M17 16h6v2h-6v-2zm0 4h6v2h-6v-2zm0 4h4v2h-4v-2z"
        fill="#FF9000"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
// Fantasy Trash Talk Logo - Basketball with draft board
</script>

<style lang="scss" scoped>
.app-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.1);
    }
  }
}
</style>