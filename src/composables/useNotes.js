// useNotes.js
import { ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useStatusStore } from '@/stores/status'
import { invoke } from '@tauri-apps/api/core';

export function useNotes() {
  const content = ref()
  const configStore = useConfigStore()
  const statusStore = useStatusStore()
  const emptyFileStarter = 'Welcome to your new notes file!\n\n'


  watch(() => configStore.isInitialized, async (newValue) => {
    if (newValue) {
      await getOrCreateNotesFile()
      statusStore.setFileLoaded(true)
    }
  })

  const getNotes = () => {
    return invoke('read_file', {
      filename: configStore.filename
    })
  }

  const createNotes = async () => {
    try {
      await invoke('write_file', {
        filename: configStore.filename,
        content: emptyFileStarter
      })
    } catch (error) {
      handleError(error)
    }
  }

  const handleError = (error) => {
    console.error(error)
    statusStore.setError(error)
    statusStore.setSaveStatus('Save failed')
  }

  const getOrCreateNotesFile = async () => {
    try {
      content.value = await getNotes()
    } catch (error) {
      if (error.startsWith('No such file or directory')) {
        await createNotes()
        content.value = emptyFileStarter
        return
      }
      handleError(error)
    }
  }

  return {
    content,
  }
}