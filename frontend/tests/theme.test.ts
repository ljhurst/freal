import { beforeEach, describe, expect, it } from 'vitest';
import { Theme } from '@/lib/theme.svelte';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = { ...initial };
  return {
    values,
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => {
      values[key] = value;
    },
  };
}

describe('Theme', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('follows the system until a choice is made', () => {
    const theme = new Theme(document.documentElement, memoryStorage());

    expect(theme.choice).toBe('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('cycles system, dark, light, then back to system', () => {
    const theme = new Theme(document.documentElement, memoryStorage());

    theme.cycle();
    expect(document.documentElement.dataset.theme).toBe('dark');
    theme.cycle();
    expect(document.documentElement.dataset.theme).toBe('light');
    theme.cycle();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('remembers the choice for the next visit', () => {
    const storage = memoryStorage();
    new Theme(document.documentElement, storage).set('light');

    const next = new Theme(document.documentElement, storage);

    expect(next.choice).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('ignores a stored value it does not recognise', () => {
    const theme = new Theme(document.documentElement, memoryStorage({ 'freal.theme': 'purple' }));

    expect(theme.choice).toBe('system');
  });

  it('still works when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    const theme = new Theme(document.documentElement, broken);
    theme.set('dark');

    expect(theme.choice).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('works with no storage at all', () => {
    const theme = new Theme(document.documentElement, null);

    theme.set('light');

    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
