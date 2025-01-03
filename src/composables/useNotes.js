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
  const filename = 'notes.txt'


  watch(() => configStore.isInitialized, async (newValue) => {
    if (newValue) {
      await getOrCreateNotesFile()
      statusStore.setFileLoaded(true)
    }
  })

  // Debounce function
  const debounce = (fn, delay) => {
    let timeoutId
    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        fn(...args)
      }, delay)
    }
  }

  const getNotes = () => {
    return invoke('read_file', {
      filename
    })
  }

  const createNotes = async () => {
    try {
      await invoke('write_file', {
        filename,
        content: emptyFileStarter
      })
    } catch (error) {
      handleError(error)
    }
  }

  const saveNotes = () => {
    return invoke('update_file', {
      filename,
      content: content.value
    })
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

  // Create debounced version of saveNotes
  const debouncedSave = debounce(async () => {
    statusStore.setSaveStatus('Saving...')
    try {
      const response = await saveNotes()
      if (response.message == "File updated successfully") {
        statusStore.setSaveStatus('Saved')
        // Clear the "Saved" message after 2 seconds
        setTimeout(() => {
          statusStore.setSaveStatus('')
        }, 2000)
      } else {
        handleError(response.message)
      }
    } catch (error) {
      handleError(error)
    }
  }, 1000)

  return {
    content,
    getOrCreateNotesFile,
    debouncedSave
  }
}