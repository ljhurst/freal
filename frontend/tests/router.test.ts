import { describe, expect, it } from 'vitest';
import { parseRoute, Router, seasonPath } from '@/lib/router.svelte';

describe('parseRoute', () => {
  it.each([
    ['/', { name: 'home' }],
    ['/auth/callback', { name: 'authCallback' }],
    ['/leagues/7/2025', { name: 'season', leagueId: 7, year: 2025, tab: 'overview' }],
    ['/leagues/7/2025/', { name: 'season', leagueId: 7, year: 2025, tab: 'overview' }],
    ['/leagues/7/2025/luck', { name: 'season', leagueId: 7, year: 2025, tab: 'luck' }],
    ['/leagues/7/2025/weekly/', { name: 'season', leagueId: 7, year: 2025, tab: 'weekly' }],
    ['/leagues/7/2025/nope', { name: 'notFound' }],
    ['/leagues/7', { name: 'notFound' }],
    ['/leagues/x/2025', { name: 'notFound' }],
    ['/nope', { name: 'notFound' }],
  ])('maps %s', (path, route) => {
    expect(parseRoute(path)).toEqual(route);
  });

  it('round-trips a season path, with and without a tab', () => {
    expect(parseRoute(seasonPath(12, 2024))).toEqual({
      name: 'season',
      leagueId: 12,
      year: 2024,
      tab: 'overview',
    });
    expect(parseRoute(seasonPath(12, 2024, 'lineups'))).toMatchObject({ tab: 'lineups' });
  });

  it('keeps the overview at the short address', () => {
    expect(seasonPath(12, 2024)).toBe('/leagues/12/2024');
    expect(seasonPath(12, 2024, 'luck')).toBe('/leagues/12/2024/luck');
  });
});

describe('Router', () => {
  it('starts at the current location', () => {
    window.history.replaceState({}, '', '/leagues/3/2025');

    expect(new Router(window).route).toEqual({
      name: 'season',
      leagueId: 3,
      year: 2025,
      tab: 'overview',
    });
  });

  it('navigates, adding a history entry', () => {
    window.history.replaceState({}, '', '/');
    const router = new Router(window);
    const before = window.history.length;

    router.navigate('/leagues/1/2024');

    expect(router.route).toEqual({ name: 'season', leagueId: 1, year: 2024, tab: 'overview' });
    expect(window.location.pathname).toBe('/leagues/1/2024');
    expect(window.history.length).toBe(before + 1);
  });

  it('replaces without adding a history entry', () => {
    window.history.replaceState({}, '', '/auth/callback');
    const router = new Router(window);
    const before = window.history.length;

    router.replace('/');

    expect(router.route).toEqual({ name: 'home' });
    expect(window.history.length).toBe(before);
  });

  it('follows the browser back button', () => {
    window.history.replaceState({}, '', '/');
    const router = new Router(window);
    router.navigate('/leagues/1/2024');

    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(router.route).toEqual({ name: 'home' });
  });
});
