import { PluginBaseShortcut } from '@/plugins/PluginBaseShortcut'
import { listen } from '@tauri-apps/api/event';
import { useStatusStore } from '@/stores/status'
import { getEditorContent } from '@/utils/editorUtils'

export class SpacesForTabPlugin extends PluginBaseShortcut {
  constructor() {
    super();
    this.name = 'Spaces for Tab';
    this.description = 'Replace a tab with spaces';
  }

  async initialize(context) {
    context.editor.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.debouncedPerform(context);
      }
    });
  }

  perform(context) {
    // Get current selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    
    // Insert the spaces directly at the cursor position
    const textNode = document.createTextNode('    ');
    range.deleteContents();
    range.insertNode(textNode);
    
    // Move cursor to after the inserted spaces
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    context.editor.dispatchEvent(new Event('input'))
  }

}