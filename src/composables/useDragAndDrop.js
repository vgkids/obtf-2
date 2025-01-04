// composables/useDragAndDrop.js
import { ref } from 'vue'
import { useStatusStore } from '@/stores/status'
import { invoke } from '@tauri-apps/api/core';

export function useDragAndDrop(context) {
  const statusStore = useStatusStore()
  const currentCursor = ref(0)

  const insertFileAtCursor = async (path) => {
    try {
      await invoke('move_media', { path })
      const content = context.content
      const blob = `${path.split('/').pop()}\n`
      context.content = content.substring(0, currentCursor.value) +
                     blob +
                     content.substring(currentCursor.value)
    } catch(error) {
      statusStore.setError(error)
    }
  }

  context.on('cursorChange', (position) => {
    currentCursor.value = position
  })

  context.on('drop', async (event) => {
    for (const path of event.payload.paths) {
      await insertFileAtCursor(path)
    }
  })

}