import type { components } from '@/lib/api/schema';

export type LeagueSummary = components['schemas']['LeagueSummary'];
export type LeagueAccess = components['schemas']['LeagueAccessView'];
export type Member = components['schemas']['Member'];
export type SeasonReport = components['schemas']['SeasonReport'];
export type TeamReport = components['schemas']['TeamReport'];
type VersionInfo = components['schemas']['VersionInfo'];

export interface Api {
  leagues(): Promise<LeagueSummary[]>;
  season(leagueId: number, year: number): Promise<SeasonReport>;
  /** Null when there is no API to ask, as in demo mode. */
  version(): Promise<string | null>;
  /** Every league with the people allowed to see it. Admins only. */
  access(): Promise<LeagueAccess[]>;
  /** Replaces the people allowed to see one league. Admins only. */
  setMembers(leagueId: number, members: Member[]): Promise<void>;
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

  async function send(method: string, path: string, body?: unknown): Promise<Response> {
    const token = await options.accessToken();
    if (token === null) {
      await options.onUnauthorized();
      throw new ApiError(401, 'invalid_token');
    }

    let response: Response;
    try {
      response = await fetchFn(`${options.baseUrl}${path}`, {
        ...(method === 'GET' ? {} : { method }),
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new ApiError(0, 'network_error');
    }

    if (response.ok) {
      return response;
    }
    if (response.status === 401) {
      await options.onUnauthorized();
    }
    throw new ApiError(response.status, await errorCode(response));
  }

  async function get<T>(path: string): Promise<T> {
    return (await (await send('GET', path)).json()) as T;
  }

  return {
    leagues: () => get<LeagueSummary[]>('/leagues'),
    season: (leagueId, year) => get<SeasonReport>(`/leagues/${leagueId}/seasons/${year}`),
    version: async () => (await get<VersionInfo>('/version')).version,
    access: () => get<LeagueAccess[]>('/admin/access'),
    setMembers: async (leagueId, members) => {
      await send('PUT', `/admin/leagues/${leagueId}/members`, { members });
    },
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
