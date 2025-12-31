
import { PluginBaseShortcut } from '@/plugins/PluginBaseShortcut'
import { listen } from '@tauri-apps/api/event';
import { useStatusStore } from '@/stores/status'

export class DatedBlankPagePlugin extends PluginBaseShortcut {
  constructor() {
    super();
    this.name = 'Dated Blank Page';
    this.description = 'Creates a new dated page with divider';
    this.performing = false;
    this.menuItem = {
      id: 'new_dated_page',
      title: 'New Dated Page', 
      shortcut: 'CmdOrCtrl+K',
      submenu: 'Edit'
    };
  }

  formatDateTime() {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour12: true
    }).format(new Date());
  }

  visibleLineCount(context) {
    if (!context.editor) return 0
    const lineHeightInPixels = 20 // must match CSS line-height
    return Math.floor(context.editor.clientHeight / lineHeightInPixels)
  }

  async initialize(context) {
    await listen('menu', (event) => {
      if (event.payload === 'new_dated_page') {
        this.debouncedPerform(context);
      }
    });
  }

  perform(context) {
    if (this.performing) return
    this.performing = true
    const statusStore = useStatusStore()
    const start = performance.now();
    const blankLinesBefore = 10;
    const linesToAllowForDateBar = 4;
    const blankLinesAfter = this.visibleLineCount(context) - linesToAllowForDateBar;
    const dividerCharacter = '_';
    const dividerLength = 80;

    // insert some blank lines before so we're clearly away from the previous entry
    let blob = '';
    for (let i = 0; i < blankLinesBefore; i++) {
      blob += '\n';
    }

    // then the date and time
    blob += `\n${this.formatDateTime()}\n`;

    // then the dividing line
    for (let i = 0; i < dividerLength; i++) {
      blob += dividerCharacter;
    }
    blob += '\n\n';
    // marking where we want the cursor to land before we add more space
    const mark = context.editor.value.length + blob.length;

    // then the blank lines after so there's plenty of room to type
    for (let i = 0; i < blankLinesAfter; i++) {
      blob += '\n';
    }
    context.editor.value += blob;
    context.editor.scrollTop = context.editor.scrollHeight;
    context.editor.setSelectionRange(mark, mark);
    context.editor.dispatchEvent(new Event('input'))
    this.performing = false
    statusStore.updateStat('blank-page', performance.now() - start)
  }

}
