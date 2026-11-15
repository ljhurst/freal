import type { Api, SeasonReport } from '@/lib/api/client';

const MAX_AGE_MS = 5 * 60_000;

/** Remembers loaded seasons, so switching views or seasons back and forth doesn't refetch. */
export class SeasonCache {
  private readonly entries = new Map<string, { at: number; report: Promise<SeasonReport> }>();

  constructor(
    private readonly api: Api,
    private readonly now: () => number = Date.now,
  ) {}

  get(leagueId: number, year: number): Promise<SeasonReport> {
    const key = `${leagueId}:${year}`;
    const cached = this.entries.get(key);
    if (cached && this.now() - cached.at < MAX_AGE_MS) {
      return cached.report;
    }

    const report = this.api.season(leagueId, year);
    this.entries.set(key, { at: this.now(), report });
    report.catch(() => {
      if (this.entries.get(key)?.report === report) {
        this.entries.delete(key);
      }
    });
    return report;
  }
}
