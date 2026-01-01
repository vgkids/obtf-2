/**
 * Utility functions for working with contenteditable editor elements
 */

/**
 * Gets the content from an editor element (contenteditable or textarea)
 * @param {HTMLElement} editor - The editor element
 * @returns {string} The content of the editor
 */
export function getEditorContent(editor) {
  if (!editor) return '';
  
  if (editor.contentEditable === 'true' || editor.isContentEditable) {
    return editor.innerText || '';
  }
  
  return editor.value || '';
}

/**
 * Calculates the visible line range in the editor viewport
 * @param {HTMLElement} editor - The editor element
 * @param {string} content - The content to analyze
 * @param {number} lineHeight - Height of each line in pixels (default: 20)
 * @returns {Object} Object containing startLine, endLine, and total lines
 */
export function getVisibleLines(editor, content, lineHeight = 20) {
  if (!editor || !content) return { startLine: 0, endLine: 0, totalLines: 0 };
  
  // Simple line splitting (no soft wrap - lines don't wrap with white-space: pre)
  const totalLines = content.split('\n').length;
  const scrollInLines = Math.round(editor.scrollTop / lineHeight);
  const visibleLineCount = Math.round(editor.clientHeight / lineHeight);
  
  const startLine = Math.max(scrollInLines, 0);
  const endLine = Math.min(startLine + visibleLineCount, totalLines);
  
  return { startLine, endLine, totalLines };
}


/**
 * Gets the character position for a given line number
 * @param {string} content - The editor content
 * @param {number} lineNumber - The line number (0-based)
 * @returns {number} The character position
 */
export function getCharacterPosition(content, lineNumber) {
  if (!content) return 0;
  
  const lines = content.split('\n');
  let position = 0;
  
  // Sum up lengths of all previous lines, plus their newline characters
  for (let i = 0; i < lineNumber && i < lines.length; i++) {
    position += lines[i].length + 1; // +1 for the newline character
  }
  
  return position;
}

/**
 * Gets the visible character range in the editor viewport
 * @param {HTMLElement} editor - The editor element
 * @param {string} content - The content to analyze
 * @param {number} lineHeight - Height of each line in pixels (default: 20)
 * @returns {Object} Object containing startPos and endPos
 */
export function getVisibleRange(editor, content, lineHeight = 20) {
  const { startLine, endLine } = getVisibleLines(editor, content, lineHeight);
  
  const startPos = getCharacterPosition(content, startLine);
  const endPos = getCharacterPosition(content, endLine);
  
  return { startPos, endPos };
}

