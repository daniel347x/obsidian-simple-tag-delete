import { Plugin, MarkdownView } from 'obsidian';

export default class SimpleTagDeletePlugin extends Plugin {
  async onload() {
    console.log('[Simple Tag Delete] plugin loaded via BRAT');

    // Log Alt+Click on tag elements in reading view (no deletion yet)
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      if (!evt.altKey) return;

      const target = evt.target as HTMLElement | null;
      if (!target) return;

      const tagEl = target.closest('a.tag, span.tag') as HTMLElement | null;
      if (!tagEl) return;

      // Ensure we're in a markdown view (reading or editing); we're only logging for now
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;

      const tagText = tagEl.textContent?.trim() ?? '';
      console.log('[Simple Tag Delete] Alt+Click on tag element:', tagText);
    });
  }

  onunload() {
    console.log('[Simple Tag Delete] plugin unloaded');
  }
}
