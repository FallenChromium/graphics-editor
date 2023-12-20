<template>
    <label v-for="option in ['DDA', 'Bresenham', 'Wu']" :key="option">
        <input type="radio" v-model="algoType" :value="option" />
        <span>{{ option }}</span>
    </label>
</template>

<script setup lang="ts">
import { useLineStore } from '@/stores/line';
import { storeToRefs } from 'pinia';
const lineStore = useLineStore();
const { algoType } = storeToRefs(lineStore);
</script>
