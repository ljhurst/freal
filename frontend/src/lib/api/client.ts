import type { components } from '@/lib/api/schema';

export type LeagueSummary = components['schemas']['LeagueSummary'];
export type SeasonReport = components['schemas']['SeasonReport'];
export type TeamReport = components['schemas']['TeamReport'];

export interface Api {
  leagues(): Promise<LeagueSummary[]>;
  season(leagueId: number, year: number): Promise<SeasonReport>;
}

export interface ApiOptions {
  baseUrl: string;
  accessToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<void>;
  fetch?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export function createApi(options: ApiOptions): Api {
  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function get<T>(path: string): Promise<T> {
    const token = await options.accessToken();
    if (token === null) {
      await options.onUnauthorized();
      throw new ApiError(401, 'invalid_token');
    }

    let response: Response;
    try {
      response = await fetchFn(`${options.baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new ApiError(0, 'network_error');
    }

    if (response.ok) {
      return (await response.json()) as T;
    }
    if (response.status === 401) {
      await options.onUnauthorized();
    }
    throw new ApiError(response.status, await errorCode(response));
  }

  return {
    leagues: () => get<LeagueSummary[]>('/leagues'),
    season: (leagueId, year) => get<SeasonReport>(`/leagues/${leagueId}/seasons/${year}`),
  };
}

async function errorCode(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : 'unknown';
  } catch {
    return 'unknown';
  }
}
