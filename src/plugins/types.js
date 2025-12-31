// src/plugins/types.js
// MenuItem interface:
// {
//   id: string
//   title: string
//   shortcut?: string
//   submenu?: string
// }

// EditorPlugin interface:
// {
//   name: string
//   description: string
//   shortcut?: string
//   menuItem?: MenuItem
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