<template>
	<div class="page-view">
		<div class="page-header">
			<h1 class="page-title">{{ teamData?.name }}</h1>
		</div>

		<v-progress-linear v-if="loading" indeterminate color="primary" />
		<players-table v-else @player-selected="onPlayerSelected" :players="teamData?.players" />

		<v-dialog max-width="500" v-model="showPlayerCard">
			<player-card :player="playerData" :pick="pick" />
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import api from '@/api/axios';
import PlayerCard from '@/components/core/PlayerCard.vue';
import PlayersTable from '@/components/core/PlayersTable.vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const id = route.params.id as string;

const loading = ref(false);
const showPlayerCard = ref(false);
const playerData = ref(null);
const teamData = ref(null);
const pick = ref(null);

const onPlayerSelected = (player: any) => {
	playerData.value = player
	showPlayerCard.value = true
}

const fetchTeamData = async () => {
	loading.value = true;
	const response = await api.get(`/teams/${id}`)
	teamData.value = response.data;
	loading.value = false;
}

onMounted(() => {
	if (id) {
		fetchTeamData();
	} else {
		console.error("No team ID provided in the route.");
	}
});
</script>

<style lang="scss" scoped></style>