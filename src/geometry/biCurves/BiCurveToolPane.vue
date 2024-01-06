<template>
    <label v-for="option in ['Horizontal', 'Vertical']" :key="option">
        <input type="radio" v-model="direction" :value="option" />
        <span>{{ option }}</span>
    </label>
</template>

<script setup lang="ts">
import { useBiCurveStore } from '@/stores/biCurves';
import { storeToRefs } from 'pinia';
const biCurveStore = useBiCurveStore();
const { direction } = storeToRefs(biCurveStore);
</script>
