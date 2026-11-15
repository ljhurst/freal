import type { User } from 'oidc-client-ts';
import { type Api, ApiError, type LeagueSummary, type SeasonReport } from '@/lib/api/client';
import type { OidcClient, Session } from '@/lib/auth/session.svelte';
import { Router } from '@/lib/router.svelte';
import { SERVICES_KEY, type Services } from '@/lib/services';

export function contextFor(services: Services): Map<symbol, Services> {
  return new Map([[SERVICES_KEY, services]]);
}

export function fakeApi(overrides: Partial<Api> = {}): Api {
  return {
    leagues: () => Promise.resolve([]),
    season: () => Promise.reject(new ApiError(404, 'season_not_found')),
    ...overrides,
  };
}

export function fakeUser(overrides: Partial<User> = {}): User {
  return {
    access_token: 'token-123',
    expired: false,
    state: undefined,
    profile: { given_name: 'Ada' },
    ...overrides,
  } as unknown as User;
}

export class FakeOidcClient implements OidcClient {
  user: User | null = null;
  redirectedWith: unknown[] = [];
  signedOut = false;
  callbackUser: User = fakeUser();

  getUser(): Promise<User | null> {
    return Promise.resolve(this.user);
  }

  signinRedirect(args?: { state?: unknown }): Promise<void> {
    this.redirectedWith.push(args?.state);
    return Promise.resolve();
  }

  signinRedirectCallback(): Promise<User> {
    return Promise.resolve(this.callbackUser);
  }

  signoutRedirect(): Promise<void> {
    this.signedOut = true;
    return Promise.resolve();
  }
}

export function services(
  options: { api?: Api; session?: Session | null; path?: string } = {},
): Services {
  window.history.replaceState({}, '', options.path ?? '/');
  return {
    api: options.api ?? fakeApi(),
    router: new Router(window),
    session: options.session === undefined ? null : options.session,
  };
}

export function league(overrides: Partial<LeagueSummary> = {}): LeagueSummary {
  return { league_id: 7, name: 'Family League', years: [2024, 2025], ...overrides };
}

export function seasonReport(): SeasonReport {
  const team = (id: number, name: string, wins: number, losses: number, pointsFor: number) => ({
    team_id: id,
    name,
    standing: {
      team_id: id,
      wins,
      losses,
      ties: 0,
      points_for: pointsFor,
      points_against: 1000,
    },
    luck: {
      team_id: id,
      expected_wins: 7,
      luck: wins - 7,
      all_play_wins: 50,
      all_play_ties: 0,
      all_play_losses: 48,
    },
    schedule: { team_id: id, average_opponent_points: 120 },
    efficiency: {
      team_id: id,
      points: 1000,
      optimal_points: 1100,
      left_on_bench: 100,
      efficiency: 0.91,
    },
    consistency: { team_id: id, mean: 120, stdev: 20 },
  });
  return {
    league_id: 7,
    year: 2025,
    name: 'Family League',
    teams: [team(1, 'Low Wins', 4, 10, 1100), team(2, 'High Wins', 10, 4, 1500)],
    weeks: [],
  } as SeasonReport;
}
