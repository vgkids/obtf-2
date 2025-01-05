import { ref } from 'vue'
import { defineStore } from 'pinia'
import { documentDir, join } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/core'


export const useConfigStore = defineStore('config', () => {
  const workingDirectory = ref('')
  const filename = 'notes.txt'
  const isInitialized = ref(false)

  const setWorkingDirectory = async () => {
    try {
      const path = await join(await documentDir(), 'OBTF')
      await invoke('set_directory', {
        path
      })

      workingDirectory.value = path
      isInitialized.value = true
    } catch (err) {
      console.error('Failed to set working directory:', err)
      isInitialized.value = false
      throw err
    }
  }

  return {
    filename,
    workingDirectory,
    isInitialized,
    setWorkingDirectory
  }
})