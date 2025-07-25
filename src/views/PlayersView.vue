<template>
  <div class="page-view">
    <div class="page-header">
      <h1 class="page-title">Player Directory</h1>
      <!-- <p class="page-subtitle">Lorem ipsum dolor sit amet</p> -->
    </div>

    <players-table @player-selected="onPlayerSelected" />

    <v-dialog max-width="500" v-model="showPlayerCard">
      <player-card :player="playerData" :pick="pick" />
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PlayersTable from '@/components/core/PlayersTable.vue';
import PlayerCard from '@/components/core/PlayerCard.vue';

const showPlayerCard = ref(false);
const playerData = ref(null);
const pick = ref(null);

const onPlayerSelected = (player: any) => {
  playerData.value = player
  showPlayerCard.value = true
}
</script>

<style lang="scss" scoped></style>