// composables/useMedia.js
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useStatusStore } from '@/stores/status'
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export function useMedia(context) {
  const mediaFiles = ref([])

  context.on('mediaMatches', (matches) => {
    mediaFiles.value = allowedFiles(matches)
    .map(match => ({
      path: convertFileSrc(match.filename),
      name: match.filename.split('/').pop()
    }))
  })

  function allowedFiles(files) {
    return files.filter(file =>
      file.filename.toLowerCase().endsWith('.png') ||
      file.filename.toLowerCase().endsWith('.jpg') ||
      file.filename.toLowerCase().endsWith('.jpeg') ||
      file.filename.toLowerCase().endsWith('.gif')
    )
  }

  return {
    mediaFiles
  }
}