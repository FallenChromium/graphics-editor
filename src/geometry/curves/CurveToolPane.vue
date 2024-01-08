<template>
    <!-- TODO: tie with CurveType -->
    <label v-for="option of ['Bezier', 'B-Spline']" :key="option">
        <input type="radio" v-model="algoType" :value="option" />
        <span>{{ option }}</span>
    </label>
</template>

<script setup lang="ts">
import {useCurveStore, type CurveType } from '@/stores/curves';
import { storeToRefs } from 'pinia';

const curveStore = useCurveStore();
const { algoType } = storeToRefs(curveStore)

</script>