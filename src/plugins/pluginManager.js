// src/plugins/pluginManager.js
import { SaveManager } from './saveManager.js';
import { DatedBlankPagePlugin } from './datedBlankPage.js';
import { MediaScannerPlugin } from './mediaScannerPlugin.js';
import { SpacesForTabPlugin } from './spacesForTab.js';
import { TimeOnlyEntryPlugin } from './timeOnlyEntry.js';
import { Find } from './find.js';

export class PluginManager {
  constructor(context) {
    this.plugins = [];
    this.context = context;

    this.eventListeners = new Map();
    this.context.emit = this.emit.bind(this);
    this.context.on = this.on.bind(this);
  }

  registerPlugin(plugin) {
    this.plugins.push(plugin);
    plugin.initialize(this.context);
  }

  getPlugins() {
    return this.plugins;
  }

  getMenuItems() {
    return this.plugins
      .filter(plugin => plugin.menuItem)
      .map(plugin => plugin.menuItem);
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  static createDefaultPlugins() {
    return [
      new SaveManager(),
      new DatedBlankPagePlugin(),
      new MediaScannerPlugin(),
      new SpacesForTabPlugin(),
      new TimeOnlyEntryPlugin(),
      new Find(),
    ];
  }
}
