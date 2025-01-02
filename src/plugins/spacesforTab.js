// src/plugins/timeOnlyEntry.js
export class SpacesForTabPlugin {
  constructor() {
    this.name = 'Spaces for Tab';
    this.description = 'Replace a tab with spaces';
    this.shortcut = 'Tab';
  }

  initialize(context) {
    context.register(this.shortcut, this.name, async () => {
      const cursor = context.editor.selectionStart;
      const content = context.content.value;
      
      let blob = '    ';
      context.content.value = content.substring(0, cursor) + blob + content.substring(cursor);
      await context.nextTick();
      const newCursor = cursor + blob.length;
      context.editor.setSelectionRange(newCursor, newCursor);
    });
  }
}