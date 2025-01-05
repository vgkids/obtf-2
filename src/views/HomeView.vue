<template>
  <main class="flex">
    <textarea
      v-model="content"
      ref="editor"
      class="editor"
    ></textarea>
    <MediaPanel
      :mediaFiles="mediaFiles"
    />
    <DragDropOverlay
      :pluginManager="pluginManager"
    />
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useStatusStore } from '@/stores/status'
import { useMedia } from '@/composables/useMedia'
import { useNotes } from '@/composables/useNotes'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useKeyboardControl } from '@/composables/useKeyboardControl'
import { PluginManager } from '../plugins/pluginManager'
import MediaPanel from '@/components/MediaPanel.vue'
import DragDropOverlay from '@/components/DragDropOverlay.vue'

const statusStore = useStatusStore()
const { content, debouncedSave } = useNotes()
const editor = ref(null)
const mediaFiles = ref([])
const { register } = useKeyboardControl()

const pluginManager = ref({})
const pluginContext = ref(null)

// Keeping this for a minute for hack performance testing
// const stats = {
//   'textarea-update': { sum: 0, count: 0, avg: 0, last: 0 },
// };

// function updateStat(name, duration) {
//   stats[name].sum += duration;
//   stats[name].count++;
//   stats[name].avg = stats[name].sum / stats[name].count;
//   stats[name].last = duration;
// }

// onMounted(() => {

// editor.value.addEventListener('keydown', (e) => {
//   const start = performance.now();

//   requestAnimationFrame(() => {

//     updateStat('textarea-update', performance.now() - start)
//     console.table(stats);
//   });

// });

// })

const initPlugins = () => {
  pluginContext.value = {
    editor: editor.value,
    content,
    register,
    nextTick,
    watch
  }

  pluginManager.value = new PluginManager(pluginContext.value)
  const { mediaFiles: mediaFilesRef } = useMedia(pluginContext.value)
  useDragAndDrop(pluginContext.value)

  watch(mediaFilesRef, (newFiles) => {
    mediaFiles.value = newFiles
  })

  PluginManager.createDefaultPlugins().forEach(plugin => {
    pluginManager.value.registerPlugin(plugin)
  })
}

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
  position: relative;
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