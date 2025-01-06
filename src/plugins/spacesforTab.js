import { PluginBaseShortcut } from '@/plugins/PluginBaseShortcut'
import { register } from '@tauri-apps/plugin-global-shortcut';
import { useStatusStore } from '@/stores/status'

export class SpacesForTabPlugin extends PluginBaseShortcut {
  constructor() {
    super();
    this.name = 'Spaces for Tab';
    this.description = 'Replace a tab with spaces';
  }

  async initialize(context) {
    await register('Tab', () => {
      this.debouncedPerform(context);
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