import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', () => {
  const saveStatus = ref('')
  const error = ref('')
  const fileLoaded = ref(false)
  const telemetry = ref('')

  const setSaveStatus = (status) => {
    saveStatus.value = status
  }

  const setError = (err) => {
    error.value = err
  }

  const setFileLoaded = (loaded) => {
    fileLoaded.value = loaded
  }

  const setTelemetry = (message) => {
    telemetry.value = message
  }

  return {
    saveStatus,
    error,
    fileLoaded,
    telemetry,
    setSaveStatus,
    setError,
    setFileLoaded,
    setTelemetry
  }
})