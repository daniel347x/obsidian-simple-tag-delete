import { Plugin, MarkdownView } from 'obsidian';

export default class SimpleTagDeletePlugin extends Plugin {
  async onload() {
    console.log('[Simple Tag Delete] plugin loaded via BRAT');

    // Alt+Click handler: logs and then removes matching tags from the active file
    this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
      if (!evt.altKey) return;

      const target = evt.target as HTMLElement | null;
      console.log('[Simple Tag Delete] Alt+Click detected', {
        tagName: target?.tagName,
        className: target?.className
      });

      if (!target) return;

      // Reading view tags are typically <a class="tag">#tag</a>.
      // Live Preview/editor spans may use cm-hashtag classes; we still require the text to start with '#'.
      const tagEl = target.closest(
        'a.tag, span.tag, span.cm-hashtag, span.cm-formatting-hashtag'
      ) as HTMLElement | null;

      if (!tagEl) {
        console.log('[Simple Tag Delete] Alt+Click had no matching tag element');
        return;
      }

      const tagText = tagEl.textContent?.trim() ?? '';
      if (!tagText.startsWith('#')) {
        console.log('[Simple Tag Delete] Alt+Click element text does not start with #, skipping:', tagText);
        return;
      }

      console.log('[Simple Tag Delete] Alt+Click on tag element:', tagText);

      // Fire-and-forget deletion; errors are logged but not surfaced to the user
      void this.deleteTagFromActiveFile(tagText);
    });
  }

  onunload() {
    console.log('[Simple Tag Delete] plugin unloaded');
  }

  /**
   * Remove all occurrences of the given tag (e.g. "#updated") from the active Markdown file
   * using metadataCache tag positions.
   */
  private async deleteTagFromActiveFile(tagText: string): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      console.log('[Simple Tag Delete] No active MarkdownView; skipping delete for', tagText);
      return;
    }

    const file = view.file;
    if (!file) {
      console.log('[Simple Tag Delete] Active view has no file; skipping delete for', tagText);
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

    let content = await this.app.vault.read(file);
    const lines = content.split('\n');

    type PosEntry = { line: number; startCol: number; endCol: number };
    const positions: PosEntry[] = matching.map(m => {
      const pos = m.position ?? {};
      const start = pos.start ?? pos;
      const end = pos.end ?? undefined;
      const line: number = start.line ?? 0;
      const startCol: number = start.col ?? 0;
      const endCol: number = end?.col ?? startCol + tagText.length;
      return { line, startCol, endCol };
    });

    // Sort by line/column descending so earlier edits don't disturb later indices
    positions.sort((a, b) => {
      if (a.line !== b.line) return b.line - a.line;
      return b.startCol - a.startCol;
    });

    for (const pos of positions) {
      const lineIndex = pos.line;
      if (lineIndex < 0 || lineIndex >= lines.length) continue;

      const originalLine = lines[lineIndex] ?? '';
      const before = originalLine.slice(0, pos.startCol);
      const after = originalLine.slice(pos.endCol);

      let newLine = before + after;

      // Clean up spacing: if we removed a middle token, avoid double spaces.
      if (before.endsWith(' ') && after.startsWith(' ')) {
        newLine = before + after.slice(1);
      }

      // Trim trailing spaces
      newLine = newLine.replace(/\s+$/, '');

      console.log('[Simple Tag Delete] Line', lineIndex, 'before:', JSON.stringify(originalLine));
      console.log('[Simple Tag Delete] Line', lineIndex, 'after :', JSON.stringify(newLine));

      lines[lineIndex] = newLine;
    }

    const newContent = lines.join('\n');
    if (newContent === content) {
      console.log('[Simple Tag Delete] No content changes applied for', tagText);
      return;
    }

    await this.app.vault.modify(file, newContent);
    console.log(
      '[Simple Tag Delete] Removed',
      positions.length,
      'occurrence(s) of',
      tagText,
      'from file',
      file.path
    );
  }
}
