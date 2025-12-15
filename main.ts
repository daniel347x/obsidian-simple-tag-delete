import { Plugin } from 'obsidian';

export default class SimpleTagDeletePlugin extends Plugin {
  async onload() {
    console.log('[Simple Tag Delete] plugin loaded via BRAT');

    // Debug: log ANY Alt+Click, then try to resolve a tag element
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      if (!evt.altKey) return;

      const target = evt.target as HTMLElement | null;
      console.log('[Simple Tag Delete] Alt+Click detected', {
        tagName: target?.tagName,
        className: target?.className
      });

      if (!target) return;

      // Try to find a tag-like element in both Reading View and Live Preview
      const tagEl = target.closest(
        'a.tag, span.tag, span.cm-hashtag, span.cm-formatting-hashtag'
      ) as HTMLElement | null;

      if (!tagEl) {
        console.log('[Simple Tag Delete] Alt+Click had no matching tag element');
        return;
      }

      const tagText = tagEl.textContent?.trim() ?? '';
      console.log('[Simple Tag Delete] Alt+Click on tag element:', tagText);
    });
  }

  onunload() {
    console.log('[Simple Tag Delete] plugin unloaded');
  }
}
