import type { Api, LeagueSummary } from '@/lib/api/client';

const MAX_AGE_MS = 5 * 60_000;

/** Remembers the league list, so a page that already has it can show it without a loading state. */
export class LeaguesCache {
  private loaded: LeagueSummary[] | undefined;
  private entry: { at: number; list: Promise<LeagueSummary[]> } | undefined;

  constructor(
    private readonly api: Api,
    private readonly now: () => number = Date.now,
  ) {}

  /** The last list that loaded, even if it is due a refresh. */
  peek(): LeagueSummary[] | undefined {
    return this.loaded;
  }

  get(): Promise<LeagueSummary[]> {
    if (this.entry && this.now() - this.entry.at < MAX_AGE_MS) {
      return this.entry.list;
    }

    const list = this.api.leagues();
    this.entry = { at: this.now(), list };
    list.then(
      (value) => {
        this.loaded = value;
      },
      () => {
        if (this.entry?.list === list) {
          this.entry = undefined;
        }
      },
    );
    return list;
  }
}
