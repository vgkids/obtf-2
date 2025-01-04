// src/plugins/datedBlankPage.js
export class DatedBlankPagePlugin {
  constructor() {
    this.name = 'Dated Blank Page';
    this.description = 'Creates a new dated page with divider';
    this.shortcut = 'command-k';
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

  initialize(context) {
    context.register(this.shortcut, this.name, async () => {
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
      const mark = context.content.length + blob.length;
      
      // then the blank lines after so there's plenty of room to type
      for (let i = 0; i < blankLinesAfter; i++) {
        blob += '\n';
      }

      context.content += blob;
      await context.nextTick();
      context.editor.focus();
      context.editor.scrollTop = context.editor.scrollHeight;
      context.editor.setSelectionRange(mark, mark);
    });
  }
}
