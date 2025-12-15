import { Plugin } from 'obsidian';

export default class SimpleTagDeletePlugin extends Plugin {
  async onload() {
    console.log(`[Simple Tag Delete] v${this.manifest.version} loaded via BRAT`);

    // DEBUG BUILD (1.1.3): log EVERY click event on document, no deletion logic.
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      const target = evt.target as HTMLElement | null;
      console.log('[Simple Tag Delete] click event', {
        altKey: evt.altKey,
        ctrlKey: evt.ctrlKey,
        shiftKey: evt.shiftKey,
        metaKey: evt.metaKey,
        tagName: target?.tagName,
        className: target?.className
      });
    });
  }

  onunload() {
    console.log(`[Simple Tag Delete] v${this.manifest.version} unloaded`);
  }
}
