// composables/useMedia.js
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useStatusStore } from '@/stores/status'
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export function useMedia() {
  const mediaFiles = ref([])
  const configStore = useConfigStore()
  const statusStore = useStatusStore()


  watch(() => configStore.isInitialized, async (newValue) => {
    if (newValue) {
      loadMedia()
    }
  })

  function allowedFiles(files) {
    return files.filter(file =>
      file.toLowerCase().endsWith('.png') ||
      file.toLowerCase().endsWith('.jpg') ||
      file.toLowerCase().endsWith('.jpeg') ||
      file.toLowerCase().endsWith('.gif')
    )
  }

  async function loadMedia() {
    try {
      const files = await invoke('list_media');
      const processedFiles = allowedFiles(files).map(filePath => {
        return {
          name: filePath.split('/').pop(),
          path: convertFileSrc(filePath)
        };
      });

      mediaFiles.value = processedFiles

    } catch (error) {
      console.error('Error loading media files:', error)
      mediaFiles.value = []
      statusStore.setError(error)
    }
  }

  return {
    mediaFiles
  }
}