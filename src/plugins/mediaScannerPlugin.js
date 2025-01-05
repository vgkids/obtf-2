import { ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useConfigStore } from '@/stores/config';
import { useStatusStore } from '@/stores/status';

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
    this.content = context.content;
    this.configStore = useConfigStore();
    this.statusStore = useStatusStore();


    watch(() => context.content, async (newVal) => {
      if (!newVal) return
      this.content = newVal
      this.debouncedScan();
    });

    // This works fine, because it doesn't rely on the reactivity loop
    context.editor.addEventListener('scroll', () => this.debouncedScan());

  }

  getVisibleRange() {
    const editor = this.context.editor;
    const linesInContent = this.content.split('\n').length;
    const scrollInLines = Math.round(editor.scrollTop / this.lineHeightInPixels);
    const startLine = Math.max(scrollInLines, 0);
    const endLine = Math.min(startLine + this.visibleLineCount, linesInContent);
    const startPos = this.getCharacterPosition(startLine);
    const endPos = this.getCharacterPosition(endLine);
    return { startPos, endPos };
  }

  get visibleLineCount() {
    const editor = this.context.editor;
    if (!editor) return 0;
    return Math.round(editor.clientHeight / this.lineHeightInPixels);
  }

  getCharacterPosition(lineNumber) {
    const lines = this.content.split('\n');
    let position = 0;
    // Sum up lengths of all previous lines, plus their newline characters
    for (let i = 0; i < lineNumber; i++) {
      position += lines[i].length + 1; // +1 for the newline character
    }
    return position;
  }

  async scanViewport() {
    if (!this.content) return;
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