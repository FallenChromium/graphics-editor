<template>
	<div class="instrument-panel">
		<div class="panel-header">
			<div class="panel-title">
				<span><i class="mdi mdi-layers-triple" /></span> {{ pane_name }}
			</div>
		</div>
		<slot></slot>
	</div>
</template>

<script setup lang="ts">
import { useLineStore } from '@/stores/line';
import { storeToRefs } from 'pinia';
const lineStore = useLineStore();
defineProps({
	pane_name: {
		type: String,
		default: 'Instrument settings'
	}
})
const { algoType } = storeToRefs(lineStore);
</script>
