import { Plugin } from 'obsidian';

export default class SimpleTagDeletePlugin extends Plugin {
  async onload() {
    console.log(`[Simple Tag Delete] v${this.manifest.version} loaded via BRAT`);

    // Alt+Click handler: delete only the clicked occurrence of the tag
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      if (!evt.altKey) return;

      const target = evt.target as HTMLElement | null;
      console.log('[Simple Tag Delete] Alt+Click detected', {
        tagName: target?.tagName,
        className: target?.className
      });

      if (!target) return;

      const selector = 'a.tag, span.tag, span.cm-hashtag, span.cm-formatting-hashtag';

      // Find the tag-like element that was clicked
      const tagEl = target.closest(selector) as HTMLElement | null;
      if (!tagEl) {
        console.log('[Simple Tag Delete] Alt+Click had no matching tag element');
        return;
      }

      const tagText = tagEl.textContent?.trim() ?? '';
      if (!tagText.startsWith('#')) {
        console.log(
          '[Simple Tag Delete] Alt+Click element text does not start with #, skipping:',
          tagText
        );
        return;
      }

      // Determine which occurrence (index) of this tagText was clicked,
      // based on DOM order of tag elements with the same text.
      const allTagEls = Array.from(
        document.querySelectorAll<HTMLElement>(selector)
      );
      const sameTextEls = allTagEls.filter(
        el => el.textContent?.trim() === tagText
      );
      const occurrenceIndex = sameTextEls.indexOf(tagEl);

      console.log('[Simple Tag Delete] Alt+Click on tag element:', tagText, {
        occurrenceIndex,
        totalOccurrencesInDOM: sameTextEls.length
      });

      if (occurrenceIndex === -1) {
        console.log(
          '[Simple Tag Delete] Could not determine clicked occurrence index; skipping delete'
        );
        return;
      }

      // Fire-and-forget deletion; errors are logged but not surfaced to the user
      void this.deleteTagFromActiveFile(tagText, occurrenceIndex);
    });
  }

  onunload() {
    console.log(`[Simple Tag Delete] v${this.manifest.version} unloaded`);
  }

  /**
   * Remove exactly one occurrence of the given tag (e.g. "#updated") from the active Markdown file,
   * using metadataCache tag positions. The occurrenceIndex comes from DOM order.
   */
  private async deleteTagFromActiveFile(tagText: string, occurrenceIndex: number): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      console.log('[Simple Tag Delete] No active file; skipping delete for', tagText);
      return;
    }

    const cache: any = this.app.metadataCache.getFileCache(file);
    const tags: any[] = cache?.tags ?? [];

    // TagCache.tag typically includes the leading '#', e.g. "#updated".
    const matching = tags.filter(t => t.tag === tagText);
    if (matching.length === 0) {
      console.log('[Simple Tag Delete] No metadata tags matching', tagText, 'found in cache');
      return;
    }

    if (occurrenceIndex < 0 || occurrenceIndex >= matching.length) {
      console.log(
        '[Simple Tag Delete] occurrenceIndex out of range for',
        tagText,
        'index=',
        occurrenceIndex,
        'matching length=',
        matching.length
      );
      return;
    }

    const target = matching[occurrenceIndex];
    const pos = target.position ?? {};
    const start = pos.start ?? pos;
    const end = pos.end ?? undefined;
    const line: number = start.line ?? 0;
    const startCol: number = start.col ?? 0;
    const endCol: number = end?.col ?? startCol + tagText.length;

    let content = await this.app.vault.read(file);
    const lines = content.split('\n');

    if (line < 0 || line >= lines.length) {
      console.log('[Simple Tag Delete] Line index out of range for', tagText, 'line=', line);
      return;
    }

    const originalLine = lines[line] ?? '';
    const before = originalLine.slice(0, startCol);
    const after = originalLine.slice(endCol);

    let newLine = before + after;

    // Clean up spacing: if we removed a middle token, avoid double spaces.
    if (before.endsWith(' ') && after.startsWith(' ')) {
      newLine = before + after.slice(1);
    }

    // Trim trailing spaces
    newLine = newLine.replace(/\s+$/, '');

    console.log('[Simple Tag Delete] Line', line, 'before:', JSON.stringify(originalLine));
    console.log('[Simple Tag Delete] Line', line, 'after :', JSON.stringify(newLine));

    lines[line] = newLine;

    const newContent = lines.join('\n');
    if (newContent === content) {
      console.log('[Simple Tag Delete] No content changes applied for', tagText);
      return;
    }

    await this.app.vault.modify(file, newContent);
    console.log(
      '[Simple Tag Delete] Removed 1 occurrence of',
      tagText,
      'at index',
      occurrenceIndex,
      'from file',
      file.path
    );
  }
}
