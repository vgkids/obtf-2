<template>
  <main class="flex">
    <textarea
      v-model="content"
      ref="editor"
      class="editor"
    ></textarea>
    <div class="media-panel">
      <div v-for="file in mediaFiles" :key="file" class="media-item">
        <img
          :src="`http://localhost:3000/media/${file}`"
          :alt="file"
          class="media-image"
        />
        <div class="media-filename">{{ file }}</div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useStatusStore } from '@/stores/status'
import { useNotes } from '@/composables/useNotes'
import { useMedia } from '@/composables/useMedia'
import { useKeyboardControl } from '@/composables/useKeyboardControl'
import { PluginManager } from '../plugins/pluginManager'

const statusStore = useStatusStore()
const { content, getOrCreateNotesFile, debouncedSave } = useNotes()
const { mediaFiles, loadMediaFiles } = useMedia()
const editor = ref(null)
const { register } = useKeyboardControl()

const initPlugins = () => {
  const context = {
    editor: editor.value,
    content,
    register,
    nextTick
  }
  const pluginManager = new PluginManager(context)
  PluginManager.createDefaultPlugins().forEach(plugin => {
    pluginManager.registerPlugin(plugin)
  })
}

onMounted(async () => {

  await getOrCreateNotesFile()
  // await loadMediaFiles()
  statusStore.setFileLoaded(true)
})

// Watch for changes in content
watch(content, () => {
  if (!statusStore.fileLoaded) return
  statusStore.setSaveStatus('Unsaved changes...')
  debouncedSave()
})

// Watch for file loaded state to initialize plugins
watch(() => statusStore.fileLoaded, (isLoaded) => {
  if (isLoaded && editor.value) {
    initPlugins()
  }
})
</script>

<style scoped>
.flex {
  display: flex;
  width: 100%;
}

textarea.editor {
  width: 66.666667%;
  height: 90vh;
  border: none;
  outline: none;
  resize: none;
  padding: 0 20px;
  color: var(--color-text);
  background: var(--color-background);
  font-family: monospace;
  font-size: 13.3333px;
  line-height: 20px;
}

textarea.editor::-webkit-scrollbar {
  display: none;
}

.media-panel::-webkit-scrollbar {
  display: none
 }

.media-panel {
  width: 33.333333%;
  height: 90vh;
  border-left: 1px solid var(--color-border);
  background: var(--color-background);
  overflow-y: auto;
  padding: 0 20px;
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