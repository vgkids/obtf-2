export class PluginBaseShortcut {
  constructor() {
    // Create the debounced perform function for all child classes
    this.debouncedPerform = this.debounce((context) => {
      // Check if child class has implemented perform
      if (typeof this.perform === 'function') {
        this.perform(context);
      } else {
        console.warn('Child class must implement perform(context) method');
      }
    }, 100);
  }

  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}