<template>
  <main class="flex"
    @dragover.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >

    <textarea
      v-model="content"
      ref="editor"
      class="editor"
    ></textarea>
    <MediaPanel :mediaFiles="mediaFiles" />
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useStatusStore } from '@/stores/status'
import { useMedia } from '@/composables/useMedia'
import { useNotes } from '@/composables/useNotes'
import { useKeyboardControl } from '@/composables/useKeyboardControl'
import { PluginManager } from '../plugins/pluginManager'
import MediaPanel from '@/components/MediaPanel.vue'

import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core';

let handleDrop = () => {};
let handleDragEnter = () => {};
let handleDragLeave = () => {};
const isDraggingOver = ref(false)

onMounted(async () => {
  handleDrop = await listen("tauri://drag-drop",
    async (event) => {
      event.payload.paths.forEach(async (path) => {
        try {
          await invoke('move_media', {path})

          const cursor = localStorage.getItem('cursor')
          const blob = `\n${path.split('/').pop()}\n`
          content.value = content.value.substring(0, cursor) + blob + content.value.substring(cursor)
          const newCursor = cursor + blob.length;
          // editor.setSelectionRange(newCursor, newCursor)

          // TODO insert into text file

          console.log(path)
        } catch(error) {
          statusStore.setError(error)
        }
      })
      isDraggingOver.value = false;
  });

  handleDragEnter = await listen("tauri://drag-enter",
    () => (isDraggingOver.value = true)
  );

  handleDragLeave = await listen("tauri://drag-leave",
    () => (isDraggingOver.value = false)
  );
});

const statusStore = useStatusStore()
const { content, debouncedSave } = useNotes()
const editor = ref(null)
const mediaFiles = ref([])
const { register } = useKeyboardControl()

const initPlugins = () => {
  const context = {
    editor: editor.value,
    content,
    register,
    nextTick
  }
  const pluginManager = new PluginManager(context)
  const { mediaFiles: mediaFilesRef } = useMedia(context)

  watch(mediaFilesRef, (newFiles) => {
    mediaFiles.value = newFiles
  })

  PluginManager.createDefaultPlugins().forEach(plugin => {
    pluginManager.registerPlugin(plugin)
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