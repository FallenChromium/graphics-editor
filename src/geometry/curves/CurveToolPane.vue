<template>
    <label v-for="option of ['Bezier', 'Hermit', 'B-Spline']" :key="option">
        <input type="radio" v-model="curveAlgo" :value="option" />
        <span>{{ option }}</span>
    </label>
</template>

<script setup lang="ts">
import { type CurveType } from '@/stores/curves';
import { ref } from 'vue';

const curveAlgo = ref<CurveType>('Bezier');
</script>