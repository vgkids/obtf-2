import { getEditorContent } from './editorUtils';

export function scrollToLine(editor, lineNumber, options = {}) {
  if (!editor) return false;
  
  const { keepFocus = false } = options;
  const content = getEditorContent(editor);
  const lines = content.split('\n');
  
  if (lineNumber < 1 || lineNumber > lines.length) {
    return false;
  }
  
  // Calculate character position for the start of the target line
  const charPosition = lines.slice(0, lineNumber - 1).reduce((sum, line) => sum + line.length + 1, 0);
  
  // Set cursor position - different for contenteditable vs textarea
  if (editor.contentEditable === 'true' || editor.isContentEditable) {
    // For contenteditable elements, use Selection API
    const textNode = editor.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      const selection = window.getSelection();
      const actualPosition = Math.min(charPosition, textNode.textContent.length);
      
      range.setStart(textNode, actualPosition);
      range.setEnd(textNode, actualPosition);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } else {
    // For textarea elements
    editor.setSelectionRange(charPosition, charPosition);
  }
  
  if (!keepFocus) {
    editor.focus();
  }
  
  // Calculate scroll position
  const lineHeight = 20; // Matches CSS line-height
  const scrollPosition = (lineNumber - 1) * lineHeight;
  
  // Scroll with some offset to center the line
  const viewportHeight = editor.clientHeight;
  const centeredPosition = Math.max(0, scrollPosition - (viewportHeight / 2));
  
  editor.scrollTop = centeredPosition;
  
  return true;
}