<template>
  <div class="media-panel">
    <div v-for="file in mediaFiles" :key="file" class="media-item">
      <img class="media-image" :src="file.path" />
      <div class="media-filename">{{ file.name }}</div>
    </div>
  </div>
</template>

<script setup>

defineProps(['mediaFiles'])

</script>

<style scoped>
.media-panel {
  width: 33.333333%;
  height: 92vh;
  border-left: 1px solid var(--color-border);
  background: var(--color-background);
  overflow-y: auto;
  padding: 0 20px;
}

.media-panel::-webkit-scrollbar {
  display: none;
}

.media-item {
  margin-bottom: 1.5rem;
}

.media-image {
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-bottom: -0.5rem;
}

.media-filename {
  font-size: 0.875rem;
  color: var(--color-text-light);
  word-break: break-all;
}
</style>