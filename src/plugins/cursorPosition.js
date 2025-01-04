export class CursorPositionPlugin {
  constructor() {
    this.name = 'cursor-position'
    this.description = 'Saves and restores cursor position'
    this.shortcut = 'none'

    this._editor = null
    this._content = null
    this._context = null
    this._contentUnwatch = null

    this.saveCursorPosition = this.saveCursorPosition.bind(this)
    this.restoreCursorPosition = this.restoreCursorPosition.bind(this)
    this.handleContentChange = this.handleContentChange.bind(this)
  }

  initialize(context) {
    this._editor = context.editor
    this._content = context.content
    this._context = context


    // Watch for content changes
    this._contentUnwatch = context.watch(
      () => this._content,
      this.handleContentChange,
      { immediate: true }
    )

    // Save cursor position on selection change
    this._editor.addEventListener('selectionchange', this.saveCursorPosition)

    // Save cursor position on input
    this._editor.addEventListener('input', this.saveCursorPosition)

    // Save cursor position on mouse release, e.g, after a click to a new position
    this._editor.addEventListener('mouseup', this.saveCursorPosition)

    // Save cursor position on key release, e.g., directional arrows
    this._editor.addEventListener('keyup', this.saveCursorPosition)

    // Save cursor position before window unload
    window.addEventListener('beforeunload', this.saveCursorPosition)
  }

  dispose() {
    if (this._contentUnwatch) {
      this._contentUnwatch()
    }

    if (this._editor) {
      this._editor.removeEventListener('selectionchange', this.saveCursorPosition)
      this._editor.removeEventListener('input', this.saveCursorPosition)
    }

    window.removeEventListener('beforeunload', this.saveCursorPosition)
  }

  handleContentChange(newContent) {
    if (newContent && this._editor) {
      this.restoreCursorPosition()
    }
  }

  saveCursorPosition() {
    if (!this._editor || !this._content) return

    const cursor = this._editor.selectionStart
    localStorage.setItem('cursor', cursor.toString())

    // Emit cursor change event
    this._context.emit('cursorChange', cursor)
  }

  restoreCursorPosition() {
    if (!this._editor || !this._content) return

    const savedPosition = parseInt(localStorage.getItem('cursor')) || 0
    const maxPosition = this._content.length

    // Ensure the cursor position is within bounds
    const safePosition = Math.min(savedPosition, maxPosition)

    this._editor.setSelectionRange(safePosition, safePosition)
    this._editor.focus()

    // Scroll cursor into view
    const lines = this._content.substr(0, safePosition).split('\n')
    const lineHeight = 20 // Matches the line-height in CSS
    const approximateScrollPosition = (lines.length - 1) * lineHeight
    this._editor.scrollTop = approximateScrollPosition

    // Emit initial cursor position
    this._context.emit('cursorChange', safePosition)
  }
}