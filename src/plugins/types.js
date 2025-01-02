// src/plugins/types.js
// EditorPlugin interface:
// {
//   name: string
//   description: string
//   shortcut?: string
//   initialize: (context: EditorContext) => void
// }

// EditorContext interface:
// {
//   editor: HTMLTextAreaElement
//   content: Ref<string>
//   register: (key: string, name: string, callback: () => Promise<void>) => void
//   getLineCount: () => number
//   nextTick: () => Promise<void>
// }