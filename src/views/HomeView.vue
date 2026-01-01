<template>
  <main class="flex">
    <div class="editor-container">
      <div
        ref="editor"
        class="editor"
        contenteditable="true"
        spellcheck="false"
        @scroll="onEditorScroll"
      ></div>

      <!-- Debug overlay -->
      <div
        v-if="configStore.debugMode"
        class="debug-overlay"
      >
        <div
          v-for="lineNumber in totalLines"
          :key="lineNumber"
          class="debug-line"
          :style="{ top: (lineNumber - 1) * 20 - scrollTop + 'px' }"
        >
          <span class="line-number">{{ lineNumber }}</span>
        </div>
      </div>
    </div>

    <MediaPanel
      :mediaFiles="mediaFiles"
    />
    <DragDropOverlay
      :pluginManager="pluginManager"
    />
  </main>
</template>

<script setup>
import { nextTick, onMounted, ref, watch, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useStatusStore } from '@/stores/status'
import { useMedia } from '@/composables/useMedia'
import { useNotes } from '@/composables/useNotes'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { PluginManager } from '../plugins/pluginManager'
import MediaPanel from '@/components/MediaPanel.vue'
import DragDropOverlay from '@/components/DragDropOverlay.vue'
import { invoke } from '@tauri-apps/api/core'
import { getEditorContent, getVisibleLines } from '@/utils/editorUtils'


const configStore = useConfigStore()
const statusStore = useStatusStore()
const { content } = useNotes()
const editor = ref(null)
const mediaFiles = ref([])


const pluginManager = ref({})
const pluginContext = ref(null)
const scrollTop = ref(0)

const totalLines = computed(() => {
  const noteContent = content.value || ''
  return noteContent.split('\n').length
})

const onEditorScroll = () => {
  if (editor.value) {
    scrollTop.value = editor.value.scrollTop
  }
}


// Keeping this around for a bit so we find out sooner if we introduce a problem.
onMounted( async () => {
  if (!configStore.inspectorEnabled) return;
  editor.value.addEventListener('keydown', (e) => {
    const start = performance.now();
    requestAnimationFrame(() => {
      statusStore.updateStat('editor-keydown', performance.now() - start)
    });
  });
})

const initPlugins = async () => {
  pluginContext.value = {
    editor: editor.value,
    content: content.value,
    nextTick,
    watch,
    register: (key, name, callback) => {
      // Register keyboard shortcuts - this could be expanded later
      console.log(`Registering shortcut: ${key} for ${name}`)
      // For now, just log the registration
    },
    getLineCount: () => {
      return content.value ? content.value.split('\n').length : 0
    }
  }

  pluginManager.value = new PluginManager(pluginContext.value)
  const { mediaFiles: mediaFilesRef } = useMedia(pluginContext.value)
  useDragAndDrop(pluginContext.value)

  watch(mediaFilesRef, (newFiles) => {
    mediaFiles.value = newFiles
  })

  PluginManager.createDefaultPlugins().forEach(plugin => {
    pluginManager.value.registerPlugin(plugin)
  })

  // Set up menu items from plugins
  const menuItems = pluginManager.value.getMenuItems()
  console.log('Menu items from plugins:', menuItems)
  if (menuItems.length > 0) {
    try {
      await invoke('set_menu_items', { menuItems })
      console.log('Successfully set menu items')
    } catch (error) {
      console.error('Failed to set menu items:', error)
    }
  } else {
    console.log('No menu items found from plugins')
  }
}

// Watch for file loaded state to initialize plugins
watch(() => statusStore.fileLoaded, (isLoaded) => {
  editor.value.innerHTML = content.value
  if (isLoaded) {
    initPlugins()
  }
})

// Watch for debug mode toggle to trigger reactivity
watch(() => configStore.debugMode, () => {
  // Force reactivity update for debug overlay
  if (editor.value) {
    onEditorScroll()
  }
})
</script>

<style scoped>
.flex {
  display: flex;
  width: 100%;
  position: relative;
}

.editor-container {
  position: relative;
  width: 66.666667%;
  height: 92vh;
}

div.editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 20px;
  color: var(--color-text);
  background: var(--color-background);
  font-family: monospace;
  font-size: 13.3333px;
  line-height: 20px;
  overflow-y: auto;
  white-space: pre;
}

div.editor::-webkit-scrollbar {
  display: none;
}

.debug-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 80px;
  pointer-events: none;
  z-index: 1000;
}

.debug-line {
  position: absolute;
  height: 20px;
  display: flex;
  align-items: center;
  font-size: 10px;
  font-family: monospace;
  padding: 0 4px;
  opacity: 0.7;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
}

.debug-line.visible {
  background: rgba(0, 255, 0, 0.2);
  opacity: 1;
}

.line-number {
  color: #fff;
  width: 30px;
  text-align: right;
}

</style>