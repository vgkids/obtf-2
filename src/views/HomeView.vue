<template>
  <main class="flex">
    <textarea
      ref="editor"
      class="editor"
      wrap="off"
      spellcheck="false"
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
import { useConfigStore } from '@/stores/config'
import { useStatusStore } from '@/stores/status'
import { useMedia } from '@/composables/useMedia'
import { useNotes } from '@/composables/useNotes'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { PluginManager } from '../plugins/pluginManager'
import MediaPanel from '@/components/MediaPanel.vue'
import DragDropOverlay from '@/components/DragDropOverlay.vue'


const configStore = useConfigStore()
const statusStore = useStatusStore()
const { content } = useNotes()
const editor = ref(null)
const mediaFiles = ref([])


const pluginManager = ref({})
const pluginContext = ref(null)


// Keeping this around for a bit so we find out sooner if we introduce a problem.
onMounted( async () => {
  if (!configStore.inspectorEnabled) return;
  editor.value.addEventListener('keydown', (e) => {
    const start = performance.now();
    requestAnimationFrame(() => {
      statusStore.updateStat('editor-keydown', performance.now() - start)
    });
  });
})

const initPlugins = () => {
  pluginContext.value = {
    editor: editor.value,
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

// Watch for file loaded state to initialize plugins
watch(() => statusStore.fileLoaded, (isLoaded) => {
  editor.value.value = content.value
  if (isLoaded) {
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