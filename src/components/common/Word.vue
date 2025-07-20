<template>
	{{ pluralOrSingular(item, count) }}
</template>

<script setup lang="ts">
const props = defineProps<{
  item?: string;
  count?: Number;
}>();

const pluralOrSingular = (item: string, count: number) => {
  return count === 1 ? item : `${item}s`;
};
</script>