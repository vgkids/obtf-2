<template>
  <header>
  <div class="top-nav">
    <span v-if="statusStore.error" class="error">
      {{ statusStore.error }}
    </span>
    <span v-if="statusStore.saveStatus" class="save-status">
      {{ statusStore.saveStatus }}
    </span>
    <span v-if="statusStore.telemetry" class="telemetry">
      {{ statusStore.telemetry }}
    </span>
  </div>
  </header>

  <div class="page">
    <RouterView />
  </div>

  <div v-if="configStore.inspectorEnabled" class="inspector">


    <div v-if="editorStats" class="editor-stats">
      <p><strong>Editor Utils Debug:</strong></p>
      <p>Content Length: {{ editorStats.contentLength }}</p>
      <p>Total Lines: {{ editorStats.totalLines }}</p>
      <p>Visible Range: {{ editorStats.visibleStart }} - {{ editorStats.visibleEnd }}</p>
      <p>Visible Count: {{ editorStats.visibleCount }}</p>
      <p>Scroll Top: {{ editorStats.scrollTop }}px</p>
      <p>Client Height: {{ editorStats.clientHeight }}px</p>
    </div>


    <span class="stats">
      <p>lineCount: {{ statusStore.lineCount }} </p>
      <p>keydown lag: {{ statusStore.stats['editor-keydown'].last}}ms</p>
      <p>saveAll count: {{ statusStore.stats['saveAll'].count }}, lag: {{ statusStore.stats['saveAll'].last }}ms</p>
      <p>new page lag: {{ statusStore.stats['blank-page'].last }}ms</p>
    </span>
  </div>

</template>


<script setup>
import { onMounted, ref, computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useStatusStore } from '@/stores/status'
import { useConfigStore } from '@/stores/config'
import { getEditorContent, getVisibleLines } from '@/utils/editorUtils'

const statusStore = useStatusStore()
const configStore = useConfigStore()
const editorElement = ref(null)
const updateTrigger = ref(0)

const editorStats = computed(() => {
  // Force reactivity by reading updateTrigger
  updateTrigger.value
  
  if (!editorElement.value) return null
  
  const content = getEditorContent(editorElement.value)
  const { startLine, endLine, totalLines } = getVisibleLines(editorElement.value, content, 20)
  
  return {
    contentLength: content.length,
    totalLines,
    visibleStart: startLine,
    visibleEnd: endLine,
    visibleCount: endLine - startLine,
    scrollTop: editorElement.value.scrollTop,
    clientHeight: editorElement.value.clientHeight
  }
})

const triggerUpdate = () => {
  updateTrigger.value++
}

onMounted(() => {
  configStore.setWorkingDirectory()
  
  // Find the editor element and attach listeners
  const findEditor = () => {
    const editor = document.querySelector('.editor')
    if (editor) {
      editorElement.value = editor
      
      // Add event listeners to trigger updates
      editor.addEventListener('scroll', triggerUpdate)
      editor.addEventListener('input', triggerUpdate)
      editor.addEventListener('keyup', triggerUpdate)
      
      // Initial trigger
      triggerUpdate()
    } else {
      setTimeout(findEditor, 100)
    }
  }
  findEditor()
})

</script>

<style scoped>

div.page {
/*  padding: 20px;*/
}

div.top-nav {
  text-align: center;
  min-height: 4vh;
  height: 4vh;
/*  background-color: dimgray;*/
}

.error {
  background-color: red;
  color: white;
  padding: 0.2rem 0.5rem;
}

.save-status, .telemetry {
  margin-left: 1rem;
  font-size: 0.9em;
  color: #666;
}

div.inspector {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 33.33%;
  height: 300px;
  padding: 8px;
  background-color: var(--color-background-mute);
  overflow-y: auto;
}

.editor-stats {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #333;
}

.editor-stats p {
  margin: 2px 0;
  font-size: 12px;
}

</style>
