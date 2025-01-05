import { invoke } from '@tauri-apps/api/core';
import { useStatusStore } from '@/stores/status'



export class SaveManager {
  constructor() {
    this.name = 'cursor-position'
    this.description = 'Saves and restores cursor position'
    this.shortcut = 'none'

    this._editor = null
    this._context = null

    this.saveAll = this.saveAll.bind(this)
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
    this._editor.addEventListener('input', this.saveAll)

    // Save on mouse release, e.g, after a click to a new position
    this._editor.addEventListener('mouseup', this.saveAll)

    // Save on key release, e.g., directional arrows
    this._editor.addEventListener('keyup', this.saveAll)

    // Manual content changes without a UI event, like drag and drop
    // this._context.on('contentChange', this.saveAll)

    // Save before window unload
    window.addEventListener('beforeunload', this.saveAll)
  }

  async saveAll() {
    if (!this._editor) return
    await this.saveCursorPosition()
    await this.saveNotes()
  }

  async saveCursorPosition() {
    const cursor = this._editor.selectionStart
    localStorage.setItem('cursor', cursor.toString())
    this._context.emit('cursorChange', cursor)
  }

  async saveNotes() {
    await invoke('update_file', {
      filename: 'notes.txt',
      content: this._editor.value
    })
  }

  restoreCursorPosition() {
    if (!this._editor) return
    const content = this._editor.value
    const savedPosition = parseInt(localStorage.getItem('cursor')) || 0
    const maxPosition = content.length

    // Ensure the cursor position is within bounds
    const safePosition = Math.min(savedPosition, maxPosition)

    this._editor.setSelectionRange(safePosition, safePosition)
    this._editor.focus()

    // Scroll cursor into view
    const lines = content.substr(0, safePosition).split('\n')
    const lineHeight = 20 // Matches the line-height in CSS
    const approximateScrollPosition = (lines.length - 1) * lineHeight
    this._editor.scrollTop = approximateScrollPosition

    // Emit initial cursor position
    this._context.emit('cursorChange', safePosition)
  }
}