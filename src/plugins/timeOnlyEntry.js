export class TimeOnlyEntryPlugin {
  constructor() {
    this.name = 'Time-Only Mini Entry';
    this.description = 'Adds a timestamp entry on Enter';
    this.shortcut = 'shift-Enter';
  }

  initialize(context) {
    context.register(this.shortcut, this.name, async () => {
      const cursor = context.editor.selectionStart;
      const content = context.content;
      const prefix = this.prefix(content, cursor);
      context.content = content.substring(0, cursor) + prefix + content.substring(cursor);
      await context.nextTick();
      const newCursor = cursor + prefix.length;
      context.editor.setSelectionRange(newCursor, newCursor);
    });
  }

  prefix(content, cursor) {
    const contentToCursor = content.substring(0, cursor);
    const lines = contentToCursor.split('\n');
    const currentLine = lines[lines.length - 1] || '';
    const indent = '                '; // 16 spaces
    const currentTime = this.formatTime();

    // Find index of last timestamp
    let lastTimestampIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (this.isTimestamp(lines[i])) {
        lastTimestampIndex = i;
        break;
      }
    }

    // Determine if we need a newline prefix
    const needsNewline = currentLine.length > 0;
    const newlinePrefix = needsNewline ? '\n' : '';

    // If no timestamp found, always print the timestamp
    if (lastTimestampIndex === -1) {
      return newlinePrefix + currentTime;
    }

    // If the last timestamp is not the current time, print the timestamp
    if (lines[lastTimestampIndex].substring(0,indent.length) !== currentTime) {
      return newlinePrefix + currentTime;
    }

    // If it's been 3 or more lines since the last timestamp, print it again
    const linesSinceTimestamp = lines.length - lastTimestampIndex - 1;
    if (linesSinceTimestamp >= 3) {
      return newlinePrefix + currentTime;
    }
    // Otherwise just indent
    return newlinePrefix + indent;
  }

  isTimestamp(line) {
    // NOTE the 4 or 5 leading spaces in the regex is specific to the indent used in the prefix
    const timeRegex = /^\s{4,5}(1[0-2]|[1-9]):([0-5][0-9])\s*(AM|PM).*$/i;
    return timeRegex.test(line);
    // timeRegex.test('     6:37 PM     ');          // true
    // timeRegex.test('    12:37 AM some text');     // true
    // timeRegex.test('     1:05 PM - Message');     // true
    // timeRegex.test('   9:05 PM  ');               // false (only 3 leading spaces)
    // timeRegex.test('6:37 PM');                    // false (no leading spaces)
  }

  formatTime() {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date())
    .padStart(12, ' ')
    .padEnd(16, ' ');
  }
}