import { type Api, ApiError, type LeagueSummary, type SeasonReport } from '@/lib/api/client';
import { PREVIEW_HOST_SUFFIX } from '@/lib/config';

/** Previews and `?demo` can't log in, so they show the anonymized sample season instead. */
export function isDemoMode(location: Pick<Location, 'hostname' | 'search'>): boolean {
  return (
    location.hostname.endsWith(PREVIEW_HOST_SUFFIX) ||
    new URLSearchParams(location.search).has('demo')
  );
}

export function createDemoApi(fetchFn: typeof fetch = globalThis.fetch.bind(globalThis)): Api {
  async function load<T>(path: string): Promise<T> {
    const response = await fetchFn(path);
    if (!response.ok) {
      throw new ApiError(response.status, 'season_not_found');
    }
    return (await response.json()) as T;
  }

  return {
    leagues: () => load<LeagueSummary[]>('/demo/leagues.json'),
    season: (_leagueId, year) => load<SeasonReport>(`/demo/season-${year}.json`),
  };
}
