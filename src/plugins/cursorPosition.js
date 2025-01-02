export class CursorPositionPlugin {
  constructor() {
    this.name = 'cursor-position'
    this.description = 'Saves and restores cursor position'
    this.shortcut = 'none'

    this._editor = null
    this._content = null

    this.saveCursorPosition = this.saveCursorPosition.bind(this)
    this.restoreCursorPosition = this.restoreCursorPosition.bind(this)
  }

  async initialize(context) {
    this._editor = context.editor
    this._content = context.content

    // Wait for next tick to ensure content is loaded
    await context.nextTick()

    if (this._content.value) {
      this.restoreCursorPosition()
    } else {
      console.warn('CursorPositionPlugin: Content not loaded during initialization')
    }

    // Save cursor position on selection change
    this._editor.addEventListener('selectionchange', this.saveCursorPosition)

    // Save cursor position on input
    this._editor.addEventListener('input', this.saveCursorPosition)

    // Save cursor position before window unload
    window.addEventListener('beforeunload', this.saveCursorPosition)
  }

  saveCursorPosition() {
    if (!this._editor || !this._content.value) return

    const cursor = this._editor.selectionStart
    localStorage.setItem('cursor', cursor.toString())
  }

  restoreCursorPosition() {
    if (!this._editor || !this._content.value) return

    const savedPosition = parseInt(localStorage.getItem('cursor')) || 0
    const maxPosition = this._content.value.length

    // Ensure the cursor position is within bounds
    const safePosition = Math.min(savedPosition, maxPosition)

    this._editor.setSelectionRange(safePosition, safePosition)
    this._editor.focus()

    // Scroll cursor into view
    const lines = this._content.value.substr(0, safePosition).split('\n')
    const lineHeight = 20 // Matches the line-height in CSS
    const approximateScrollPosition = (lines.length - 1) * lineHeight
    this._editor.scrollTop = approximateScrollPosition
  }
}