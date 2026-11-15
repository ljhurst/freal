export type ThemeChoice = 'system' | 'dark' | 'light';

const STORAGE_KEY = 'freal.theme';
const CYCLE: Record<ThemeChoice, ThemeChoice> = { system: 'dark', dark: 'light', light: 'system' };

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export class Theme {
  choice = $state<ThemeChoice>('system');

  constructor(
    private readonly root: HTMLElement,
    private readonly storage: ThemeStorage | null,
  ) {
    this.choice = this.read();
    this.apply();
  }

  /** Moves to the next choice: follow the system, then dark, then light. */
  cycle(): void {
    this.set(CYCLE[this.choice]);
  }

  set(choice: ThemeChoice): void {
    this.choice = choice;
    this.apply();
    this.write();
  }

  private apply(): void {
    if (this.choice === 'system') {
      delete this.root.dataset.theme;
    } else {
      this.root.dataset.theme = this.choice;
    }
  }

  private read(): ThemeChoice {
    try {
      const stored = this.storage?.getItem(STORAGE_KEY);
      return stored === 'dark' || stored === 'light' ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private write(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, this.choice);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
  }
}
