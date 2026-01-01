// composables/useDragAndDrop.js
import { ref } from 'vue'
import { useStatusStore } from '@/stores/status'
import { invoke } from '@tauri-apps/api/core';
import { getEditorContent } from '@/utils/editorUtils'

export function useDragAndDrop(context) {
  const statusStore = useStatusStore()
  const currentCursor = ref(0)

  const insertFileAtCursor = async (path) => {
    try {
      await invoke('move_media', { path })
      const filename = `${path.split('/').pop()}\n`
      
      // Get current selection
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      
      // Create text node with filename
      const textNode = document.createTextNode(filename);

      // Insert the text directly at the cursor position
      range.deleteContents();
      range.insertNode(textNode);

      // Move cursor to after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      context.editor.dispatchEvent(new Event('input'))
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