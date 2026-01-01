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
    // Get current selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Create the time entry text
    const timeText = '\n\n---' + this.formatTime() + '\n';
    const textNode = document.createTextNode(timeText);

    // Insert the text directly at the cursor position
    range.deleteContents();
    range.insertNode(textNode);

    // Move cursor to after the inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

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