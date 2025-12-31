import { PluginBaseShortcut } from '@/plugins/PluginBaseShortcut'
import { listen } from '@tauri-apps/api/event';
import { useStatusStore } from '@/stores/status'

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
    const cursor = context.editor.selectionStart;
    let blob = '    ';
    let content = context.editor.value
    context.editor.value = content.substring(0, cursor) + blob + content.substring(cursor);
    const newCursor = cursor + blob.length;
    context.editor.setSelectionRange(newCursor, newCursor)
    context.editor.dispatchEvent(new Event('input'))
  }

}