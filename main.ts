import { Plugin } from 'obsidian';

export default class SimpleTagDeletePlugin extends Plugin {
  async onload() {
    console.log('[Simple Tag Delete] plugin loaded via BRAT');
  }

  onunload() {
    console.log('[Simple Tag Delete] plugin unloaded');
  }
}
