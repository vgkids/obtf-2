import { ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useConfigStore } from '@/stores/config';
import { useStatusStore } from '@/stores/status';
import { getEditorContent, getVisibleRange, getCharacterPosition } from '@/utils/editorUtils';

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

export class MediaScannerPlugin {
  constructor() {
    this.name = 'Media Scanner';
    this.description = 'Scans visible content for media file references';
    this.currentMatches = ref([]);
    this.isScanning = ref(false);
    this.lineHeightInPixels = 20; // must match CSS line-height

    // Create debounced scan function
    this.debouncedScan = debounce(this.scanViewport.bind(this), 20);
  }

  initialize(context) {
    this.context = context;
    this.content = '';
    this.configStore = useConfigStore();
    this.statusStore = useStatusStore();
    context.editor.addEventListener('scroll', this.debouncedScan);
    context.editor.addEventListener('input', this.debouncedScan)
  }

  getVisibleRange() {
    return getVisibleRange(this.context.editor, this.content, this.lineHeightInPixels);
  }

  get visibleLineCount() {
    const editor = this.context.editor;
    if (!editor) return 0;
    return Math.round(editor.clientHeight / this.lineHeightInPixels);
  }

  getCharacterPosition(lineNumber) {
    return getCharacterPosition(this.content, lineNumber);
  }

  async scanViewport() {
    if (!this.context.editor) return;
    this.content = this.context.content || ''
    if (this.isScanning.value) return;

    try {
      this.isScanning.value = true;
      const { startPos, endPos } = this.getVisibleRange();
      const visibleContent = this.content.substring(startPos, endPos)

      // console.log(visibleContent)
      // Scan the content range for media references
      const result = await invoke('scan_content_for_media', {
        content: visibleContent
      });

      this.currentMatches.value = result.matches;
      this.context.emit('mediaMatches', result.matches);
    } catch (error) {
      console.error('Error scanning for media:', error);
      this.statusStore.setError(error);
    } finally {
      this.isScanning.value = false;
    }
  }

  getMatches() {
    return this.currentMatches.value;
  }

  cleanup() {
    this.currentMatches.value = [];
  }
}