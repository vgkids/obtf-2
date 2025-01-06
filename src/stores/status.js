import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', () => {
  const saveStatus = ref('')
  const error = ref('')
  const fileLoaded = ref(false)
  const telemetry = ref('')
  const lineCount = ref()

  // Keeping this for a minute for hack performance testing
  const stats = ref({
    'editor-keydown': { sum: 0, count: 0, avg: 0, last: 0 },
    'saveAll': { sum: 0, count: 0, avg: 0, last: 0 },
    'blank-page': { sum: 0, count: 0, avg: 0, last: 0 },
  });

  const updateStat =(name, duration) => {
    stats.value[name].sum += duration;
    stats.value[name].count++;
    stats.value[name].avg = stats.value[name].sum / stats.value[name].count;
    stats.value[name].last = Math.round(duration, 3);
  }

  const setLineCount = (count) => {
    lineCount.value = count
  }

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
    lineCount,
    setLineCount,
    saveStatus,
    error,
    fileLoaded,
    stats,
    telemetry,
    setSaveStatus,
    setError,
    setFileLoaded,
    updateStat,
    setTelemetry
  }
})