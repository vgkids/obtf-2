// src/plugins/pluginManager.js
import { CursorPositionPlugin } from './cursorPosition.js';
import { SpacesForTabPlugin } from './spacesForTab.js';
import { DatedBlankPagePlugin } from './datedBlankPage.js';
import { TimeOnlyEntryPlugin } from './timeOnlyEntry.js';

export class PluginManager {
  constructor(context) {
    this.plugins = [];
    this.context = context;
  }

  registerPlugin(plugin) {
    this.plugins.push(plugin);
    plugin.initialize(this.context);
  }

  getPlugins() {
    return this.plugins;
  }

  static createDefaultPlugins() {
    return [
      new CursorPositionPlugin(),
      new DatedBlankPagePlugin(),
      new SpacesForTabPlugin(),
      new TimeOnlyEntryPlugin(),
    ];
  }
}
