<template>
  <div 
    class="drag-drop-overlay"
    :class="{ 'is-dragging': isDraggingOver }"
    @dragover.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div v-if="isDraggingOver" class="drag-indicator">
      Release to add media
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { listen } from '@tauri-apps/api/event'

const props = defineProps({
  pluginManager: {
    type: Object,
    required: true
  }
})

const isDraggingOver = ref(false)

onMounted(async () => {
  const handleDrop = await listen("tauri://drag-drop",
    async (event) => {
      props.pluginManager?.emit('drop', event)
      isDraggingOver.value = false
    }
  )

  const handleDragEnter = await listen("tauri://drag-enter",
    () => {
      isDraggingOver.value = true
    }
  )

  const handleDragLeave = await listen("tauri://drag-leave",
    () => {
      isDraggingOver.value = false
    }
  )
})
</script>

<style scoped>
.drag-drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.drag-drop-overlay.is-dragging {
  background: var(--color-background-overlay);
  pointer-events: all;
}

.drag-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem 2rem;
  background: var(--color-background);
  border: 2px dashed var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
}
</style>