<template>
	<div class="instrument-panel">
		<div class="panel-header">
			<div class="panel-title">
				<span><i class="mdi mdi-layers-triple" /></span> Line tool
			</div>
		</div>
		<div class="panel-content">
			<label v-for="option in ['DDA', 'Bresenham', 'Wu']" :key="option">
				<input type="radio" v-model="algoType" :value="option" />
				<span>{{ option }}</span>
			</label>

		</div>
	</div>
</template>

<script setup lang="ts">
import { useLineStore } from '@/stores/line';
import { storeToRefs } from 'pinia';
const lineStore = useLineStore();
const { algoType } = storeToRefs(lineStore);
</script>
