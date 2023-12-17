<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useLineStore } from './stores/line';
const lineStore = useLineStore()

</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Editor</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  height: 4vh;
}
nav {
  width: 100%;
  font-size: 12px;
  text-align: left;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

header {
  display: flex;
}

header .wrapper {
  display: flex;
  flex-direction: row;
  place-items: flex-start;
  flex-wrap: wrap;
}

nav {
  text-align: left;
  font-size: 1rem;

  padding: 0.4rem 0;

}
</style>
