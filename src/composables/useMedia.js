// composables/useMedia.js
import { ref } from 'vue'
import { useStatusStore } from '@/stores/status'

export function useMedia() {
  const mediaFiles = ref([])
  const statusStore = useStatusStore()

  const getMediaFiles = () => {
    return fetch('http://localhost:3000/media', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
  }

  const loadMediaFiles = async () => {
    try {
      const response = await getMediaFiles()
      if (response.ok) {
        const files = await response.json()
        mediaFiles.value = files.filter(file => 
          file.toLowerCase().endsWith('.png') || 
          file.toLowerCase().endsWith('.jpg') || 
          file.toLowerCase().endsWith('.jpeg') ||
          file.toLowerCase().endsWith('.gif')
        )
      } else {
        console.error('Failed to load media files')
        statusStore.setError('Failed to load media files')
        mediaFiles.value = []
      }
    } catch (error) {
      console.error('Error loading media files:', error)
      mediaFiles.value = []
      statusStore.setError(error)
    }
  }

  return {
    mediaFiles,
    loadMediaFiles
  }
}