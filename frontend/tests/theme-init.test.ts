import { beforeEach, describe, expect, it } from 'vitest';
import { Theme } from '@/lib/theme.svelte';
import themeInit from '../public/theme-init.js?raw';

function runThemeInit(): void {
  new Function(themeInit)();
}

describe('theme-init.js', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it.each(['dark', 'light'])('applies a pinned %s theme before the app loads', (choice) => {
    localStorage.setItem('freal.theme', choice);

    runThemeInit();

    expect(document.documentElement.dataset.theme).toBe(choice);
  });

  it('leaves the OS preference alone when nothing is pinned', () => {
    runThemeInit();

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('ignores a stored value it does not recognise', () => {
    localStorage.setItem('freal.theme', 'purple');

    runThemeInit();

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('reads the same key the app writes', () => {
    new Theme(document.documentElement, localStorage).set('light');
    delete document.documentElement.dataset.theme;

    runThemeInit();

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('does not throw when storage is blocked', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });

    try {
      expect(runThemeInit).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(window, 'localStorage', original);
      }
    }
  });
});
