import { invoke } from '@tauri-apps/api/core';
import { useConfigStore } from '@/stores/config'
import { useStatusStore } from '@/stores/status'
import { getEditorContent } from '@/utils/editorUtils'



export class SaveManager {
  constructor() {
    this.name = 'cursor-position'
    this.description = 'Saves and restores cursor position'
    this.shortcut = 'none'

    this._editor = null
    this._context = null

    this._throttledSaveAll = this.throttleWithFinal(this.saveAll, 500);
    this._throttledSaveAll = this._throttledSaveAll.bind(this);

    this.saveAll = this.saveAll.bind(this)
    this.throttledSaveAll = this.throttledSaveAll.bind(this)
    this.saveCursorPosition = this.saveCursorPosition.bind(this)
    this.restoreCursorPosition = this.restoreCursorPosition.bind(this)
  }

  initialize(context) {

    this._editor = context.editor
    this._context = context

    // this catches the initial event to restore the cursor, and not more.
    const statusStore = useStatusStore()
    context.watch(
      () => statusStore.fileLoaded,
      this.restoreCursorPosition,
      { immediate: true }
    )

    // Save on selection change
    this._editor.addEventListener('selectionchange', this.saveAll)

    // Save on input
    this._editor.addEventListener('input', this._throttledSaveAll)

    // Save on mouse release, e.g, after a click to a new position
    this._editor.addEventListener('mouseup', this._throttledSaveAll)

    // Save on key release, e.g., directional arrows
    this._editor.addEventListener('keyup', this._throttledSaveAll)

    // Save before window unload
    window.addEventListener('beforeunload', this._throttledSaveAll)
  }

  throttledSaveAll() {
    this.throttleWithFinal(this.saveAll, 500)
  }

  async saveAll() {
    if (!this._editor) return
    const statusStore = useStatusStore()
    const content = getEditorContent(this._editor)
    statusStore.setLineCount(content.split('\n').length)
    const start = performance.now();
    await this.saveCursorPosition()
    await this.saveNotes()
    statusStore.updateStat('saveAll', performance.now() - start)
  }

  async saveCursorPosition() {
    const selection = window.getSelection()
    if (!selection.rangeCount) return

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(this._editor)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const cursor = preCaretRange.toString().length

    localStorage.setItem('cursor', cursor.toString())
    this._context.emit('cursorChange', cursor)
  }

  async saveNotes() {
    const configStore = useConfigStore()
    debugger
    const content = getEditorContent(this._editor)
    await invoke('update_file', {
      filename: configStore.filename,
      content: content
    })
  }

  restoreCursorPosition() {
    if (!this._editor) return
    const content = getEditorContent(this._editor)
    const savedPosition = parseInt(localStorage.getItem('cursor')) || 0
    const maxPosition = content.length

    // Ensure the cursor position is within bounds
    const safePosition = Math.min(savedPosition, maxPosition)

    // Set cursor position for contenteditable
    const textNode = this._editor.firstChild || this._editor
    if (textNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange()
      const selection = window.getSelection()
      const actualPosition = Math.min(safePosition, textNode.nodeValue.length)

      range.setStart(textNode, actualPosition)
      range.setEnd(textNode, actualPosition)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      // Fallback for empty contenteditable
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(this._editor)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    this._editor.focus()

    // Scroll cursor into view
    const lines = content.substr(0, safePosition).split('\n')
    const lineHeight = 20 // Matches the line-height in CSS
    const approximateScrollPosition = (lines.length - 1) * lineHeight
    this._editor.scrollTop = approximateScrollPosition

    // Emit initial cursor position
    this._context.emit('cursorChange', safePosition)
  }

  throttleWithFinal(fn, delay) {
    let lastCall = 0;
    let pendingCall = null;

    return function (...args) {
      const now = Date.now();

      // Clear any existing pending timeout
      if (pendingCall) {
        clearTimeout(pendingCall);
      }

      if (now - lastCall >= delay) {
        // If enough time has passed, execute immediately
        fn.apply(this, args);
        lastCall = now;
      } else {
        // Otherwise schedule the call for when the delay period ends
        pendingCall = setTimeout(() => {
          fn.apply(this, args);
          lastCall = Date.now();
          pendingCall = null;
        }, delay - (now - lastCall));
      }
    };
  }

}