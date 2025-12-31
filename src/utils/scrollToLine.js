export function scrollToLine(editor, lineNumber, options = {}) {
  if (!editor) return false;
  
  const { keepFocus = false } = options;
  const content = editor.value;
  const lines = content.split('\n');
  
  if (lineNumber < 1 || lineNumber > lines.length) {
    return false;
  }
  
  // Calculate character position for the start of the target line
  const charPosition = lines.slice(0, lineNumber - 1).reduce((sum, line) => sum + line.length + 1, 0);
  
  // Set cursor to start of line
  editor.setSelectionRange(charPosition, charPosition);
  
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