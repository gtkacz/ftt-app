<template>
  <TradeReview :trade-id="Number(tradeId)" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import TradeReview from '@/components/trade/TradeReview.vue';

const route = useRoute();
const tradeId = route.params.id;
</script>
