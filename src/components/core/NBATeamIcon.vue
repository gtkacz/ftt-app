<template>
	<img :src="logoUrl" :alt="$t('nbaTeamIcon.logoAlt', { team })" :width="size" :height="size" :class="className" />
</template>

<script lang="ts">
export default {
	name: 'NBATeamLogo',
	props: {
		team: { type: String, default: 'nba' },
		size: { type: [Number, String], default: 50 },
		className: { type: String, default: '' }
	},
	computed: {
		logoUrl() {
			return `https://raw.githubusercontent.com/gtkacz/nba-logo-api/main/icons/${this.team.toLowerCase()}.svg`;
		}
	}
};
</script>