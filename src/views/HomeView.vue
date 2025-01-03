<template>
  <main class="flex">
    <textarea
      v-model="content"
      ref="editor"
      class="editor"
    ></textarea>
    <MediaPanel />
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useStatusStore } from '@/stores/status'
import { useNotes } from '@/composables/useNotes'
import { useKeyboardControl } from '@/composables/useKeyboardControl'
import { PluginManager } from '../plugins/pluginManager'
import MediaPanel from '@/components/MediaPanel.vue'

const statusStore = useStatusStore()
const { content, getOrCreateNotesFile, debouncedSave } = useNotes()
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
  height: 92vh;
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
</style>