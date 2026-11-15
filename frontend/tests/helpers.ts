import type { User } from 'oidc-client-ts';
import {
  type Api,
  ApiError,
  type LeagueSummary,
  type SeasonReport,
  type TeamReport,
} from '@/lib/api/client';
import type { OidcClient, Session } from '@/lib/auth/session.svelte';
import { Router } from '@/lib/router.svelte';
import { SeasonCache } from '@/lib/season/cache';
import { SERVICES_KEY, type Services } from '@/lib/services';
import { Theme } from '@/lib/theme.svelte';
import demoSeason from '../public/demo/season-2025.json';

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
  const api = options.api ?? fakeApi();
  return {
    api,
    seasons: new SeasonCache(api),
    router: new Router(window),
    theme: new Theme(document.documentElement, null),
    session: options.session === undefined ? null : options.session,
  };
}

export function league(overrides: Partial<LeagueSummary> = {}): LeagueSummary {
  return { league_id: 7, name: 'Family League', years: [2024, 2025], ...overrides };
}

/** The sample season that demo mode serves, checked against the generated API types. */
export function seasonReport(): SeasonReport {
  const report = structuredClone(demoSeason);
  return {
    ...report,
    // JSON modules widen string literals, so the verdict and strength need narrowing back.
    teams: report.teams.map((team) => ({
      ...team,
      verdict: team.verdict as TeamReport['verdict'],
      strength: team.strength as TeamReport['strength'],
    })),
  };
}
