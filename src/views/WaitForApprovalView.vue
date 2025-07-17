<template>
	<main>
		<app-logo size="9ch" />
		<h2>Waiting for approval</h2>
		<p>
			<span>
				Your account is pending approval. Please wait for an administrator to review your request.
			</span>
			<br />
			<small>
				If you have any questions, please contact an administrator.
			</small>
		</p>
	</main>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
main {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	width: 100%;
	text-align: center;
	overflow: hidden;
	gap: 1rem;

	h2 {
		font-size: 2rem;
	}
}
</style>