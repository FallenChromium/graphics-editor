<template>
    <div class="toolbar">
        <div class="tool-container" v-for="tool in tools" :key="tool.id">
            <button
                :class="(tool.id === activeTool ? 'toolbar-button-active' : 'toolbar-button-inactive') + ' toolbar-button'"
                @click="selectedToolChanged(tool.id)">
                <i :class="`mdi mdi-${tool.icon}`" />
            </button>
        </div>
        <div class="seperator" />
        <input type="color" id="color-picker" :value="color" @change="(e) => selectedColorChanged((e.target as HTMLInputElement).value)" />
    </div>
</template>

<script setup lang="ts">
import '@mdi/font/css/materialdesignicons.min.css'
import type { tool } from './types';

const emits = defineEmits(['tool-changed', 'color-changed'])
function selectedToolChanged(id: number) {
    emits('tool-changed', id);
}
function selectedColorChanged(color: string) {
    emits('color-changed', color);
}

const props = defineProps({
    tools: {
        type: Array<tool>
    },
    activeTool: Number,
    color: String
})
</script>

<style>
.toolbar {
    width: 3vw;
    background: #08090d;
    display: flex;
    flex-direction: column;
    /* justify-content: center; */
    align-items: center;
    padding-top: 40px;
}

.toolbar-button-inactive {
    width: 48px;
    height: 48px;
    outline: none;
    border: none;
    background: none;
    font-size: 16pt;
}

.toolbar-button-active {
    width: 48px;
    height: 48px;
    outline: none;
    border: 2px solid var(--foreground);
    background: #1a1c29;
    font-size: 16pt;
    border-radius: 8px;
}

.toolbar-button {
    color: var(--foreground);
}

.seperator {
    margin-top: 10px;
    margin-bottom: 10px;
    border-top: 1px solid #2a2d42;
    height: 10px;
    width: 48px;
}

#color-picker {
    width: 32px;
    height: 32px;
}

#color-picker::-webkit-color-swatch-wrapper {
    padding: 0;
}

#color-picker::-webkit-color-swatch {
    border: none !important;
    outline: none;
    color: red;
}
</style>