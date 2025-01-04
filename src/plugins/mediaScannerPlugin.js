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
    this.matchCache = new Map(); // Cache results by viewport range
    this.currentMatches = ref([]);
    this.isScanning = ref(false);
    this.lineHeightInPixels = 20 // must match CSS line-height
  }

  initialize(context) {
    this.context = context;
    this.configStore = useConfigStore();
    this.statusStore = useStatusStore();

    // Set up content change watcher
    watch(() => context.content.value, this.handleContentChange.bind(this));

    // Set up viewport change listener
    context.editor.addEventListener('scroll', debounce(this.handleViewportChange.bind(this), 150));

    // Initial scan when everything is ready
    watch(() => this.configStore.isInitialized, async (initialized) => {
      if (initialized) {
        await this.scanViewport();
      }
    });
  }

  handleContentChange = debounce(async () => {
    this.matchCache.clear(); // Invalidate cache when content changes
    await this.scanViewport();
  }, 150);

  async handleViewportChange() {
    const { startPos, endPos } = this.getVisibleRange();
    const cacheKey = `${startPos}-${endPos}`;

    // Check cache first
    if (this.matchCache.has(cacheKey)) {
      this.currentMatches.value = this.matchCache.get(cacheKey);
      return;
    }

    await this.scanViewport();
  }

  getVisibleRange() {
    const editor = this.context.editor;
    const content = editor.value || '';
    const linesInContent = content.split('\n').length
    const scrollInLines = Math.round(editor.scrollTop / this.lineHeightInPixels)
    const startLine = Math.max(scrollInLines, 0)
    const endLine = Math.min(startLine + this.visibleLineCount, linesInContent);
    const startPos = this.getCharacterPosition(content, startLine);
    const endPos = this.getCharacterPosition(content, endLine);
    return { startPos, endPos };
  }

  get visibleLineCount() {
    const editor = this.context.editor;
    if (!editor) return 0
    return Math.round(editor.clientHeight / this.lineHeightInPixels)
  }

  getCharacterPosition(content, lineNumber) {
    const lines = content.split('\n');
    let position = 0;
    // Sum up lengths of all previous lines, plus their newline characters
    for (let i = 0; i < lineNumber; i++) {
        position += lines[i].length + 1; // +1 for the newline character
    }
    return position;
  }

  async scanViewport() {
    if (this.isScanning.value) {
      return;
    }

    try {
      this.isScanning.value = true;
      const { startPos, endPos } = this.getVisibleRange();

      // Scan the content range for media references
      const result = await invoke('scan_content_for_media', {
        filename: 'notes.txt',
        range: {
          start: startPos,
          end: endPos
        }
      });

      // Cache and update results
      // TODO Implement to include when text is modified, disabling for now
      // const cacheKey = `${startPos}-${endPos}`;
      // this.matchCache.set(cacheKey, result.matches);
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
    this.matchCache.clear();
    this.currentMatches.value = [];
  }
}