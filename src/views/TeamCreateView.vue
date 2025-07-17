<template>
	<v-container fluid class="fill-height ">
		<v-row align="center" justify="center">
			<v-col cols="12" sm="8" md="6" lg="4">
				<v-card rounded="xl" class="pa-8 login-card">
					<v-card-title class="text-h4 text-center pb-2">
						<v-row align="center" justify="center" no-gutters><app-logo size="3ch" /></v-row>
						<v-row align="center" justify="center">Create Team</v-row>
					</v-card-title>
					<v-card-subtitle class="text-center pb-4">
						You must create a team to start playing.
					</v-card-subtitle>

					<v-form @submit.prevent="handleCreateTeam" v-model="formValid">
						<v-text-field rounded v-model="teamName" label="Team Name" variant="outlined"
							append-inner-icon="account_box" :rules="[rules.required]" class="mb-3" color="secondary" />

						<v-file-input rounded v-model="teamIcon" accept="image/*" label="Team Icon" prepend-icon=""
							append-inner-icon="image" show-size truncate-length="15" color="primary" variant="outlined"
							clearable single-line />
						<!-- <v-row align="center" justify="center" class="mb-6">
							<v-avatar size="48" class="mb-2" v-if="iconPreview">
								<img :src="iconPreview" alt="Team Icon Preview" />
							</v-avatar>
							<v-avatar size="96" class="mb-2" v-else>
								<v-icon size="48">hide_image</v-icon>
							</v-avatar>

						</v-row> -->
						<v-btn type="submit" block size="large" :loading="authStore.isLoading"
							:disabled="!formValid || authStore.isLoading" color="secondary" rounded="xl" class="my-4">
							Create
						</v-btn>
					</v-form>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from "../stores/auth";
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const user = authStore.user;

const teamName = ref('');
const teamIcon = ref<File | null>(null);
const formValid = ref(false);
const isLoading = ref(false);

const rules = {
	required: (v: string) => !!v || 'This field is required',
};

// const iconPreview = computed(() => {
// 	if (teamIcon.value) return URL.createObjectURL(teamIcon.value);
// 	return null;
// });

const handleCreateTeam = async () => {
	if (!formValid.value) return;
	isLoading.value = true;

	const payload = new FormData();
	payload.append('owner', user.id);
	payload.append('name', teamName.value);
	if (teamIcon.value) payload.append('icon', teamIcon.value);

	const success = await authStore.createTeam(payload);
	isLoading.value = false;

	if (success) {
		router.push('/');
	}
};
</script>

<style lang="scss" scoped>
.login-card {
	background-color: transparent;
	border: 1px solid rgb(var(--v-theme-on-surface));
}
</style>
