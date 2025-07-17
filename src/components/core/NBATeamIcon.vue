<template>
	<img :src="logoUrl" :alt="`${team} Logo`" :width="size" :height="size" :class="className" />
</template>

<script lang="ts">
export default {
	name: 'NBATeamLogo',
	props: {
		team: { type: String, required: true },
		size: { type: Number, default: 50 },
		className: { type: String, default: '' }
	},
	computed: {
		logoUrl() {
			return `https://raw.githubusercontent.com/gtkacz/nba-logo-api/main/icons/${this.team.toLowerCase()}.svg`;
		}
	}
};
</script>