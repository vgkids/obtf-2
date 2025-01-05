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
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const before = encoder.encode(content.substring(0, currentCursor.value));
      const middle = encoder.encode(blob);
      const after = encoder.encode(content.substring(currentCursor.value));

      const combined = new Uint8Array(before.length + middle.length + after.length);
      combined.set(before, 0);
      combined.set(middle, before.length);
      combined.set(after, before.length + middle.length);

      context.content = decoder.decode(combined);
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