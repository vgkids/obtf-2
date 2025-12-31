import { PluginBaseShortcut } from '@/plugins/PluginBaseShortcut'
import { listen } from '@tauri-apps/api/event';

export class TimeOnlyEntryPlugin extends PluginBaseShortcut {
  constructor() {
    super();
    this.name = 'Time-Only Mini Entry';
    this.description = 'Adds a timestamp';
    this.menuItem = {
      id: 'insert_time',
      title: 'New Entry',
      shortcut: 'Shift+CmdOrCtrl+K',
      submenu: 'Edit'
    };
  }

  async initialize(context) {
    await listen('menu', (event) => {
      if (event.payload === 'insert_time') {
        this.debouncedPerform(context);
      }
    });
  }

  perform(context) {
    const cursor = context.editor.selectionStart;
    let blob = '\n\n' + this.formatTime() + '\n';
    let content = context.editor.value;
    context.editor.value = content.substring(0, cursor) + blob + content.substring(cursor);
    const newCursor = cursor + blob.length;
    context.editor.setSelectionRange(newCursor, newCursor)
    context.editor.dispatchEvent(new Event('input'))
  }

  formatTime() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date())
    .padStart(8, ' ')
    .padEnd(16, ' ');
  }
}