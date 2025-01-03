// composables/useMedia.js
import { ref } from 'vue'
import { useStatusStore } from '@/stores/status'
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export function useMedia() {
  const mediaFiles = ref([])
  const statusStore = useStatusStore()


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
      // TODO This needs some work, but let's keep moving for now
      await invoke('set_directory', {
        path: '/Users/jamesmarks/Documents/OBTF'
      })

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
    loadMedia,
    mediaFiles
  }
}