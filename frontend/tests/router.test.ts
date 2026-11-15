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

  it('reads the selected team from the query, and ignores anything that is not a team number', () => {
    expect(parseRoute('/leagues/7/2025/weekly', '?team=6')).toEqual({
      name: 'season',
      leagueId: 7,
      year: 2025,
      tab: 'weekly',
      team: 6,
    });
    expect(parseRoute('/leagues/7/2025/weekly', '?team=abc')).not.toHaveProperty('team');
    expect(parseRoute('/leagues/7/2025/weekly', '?team=-1')).not.toHaveProperty('team');
    expect(parseRoute('/leagues/7/2025/weekly', '?other=1')).not.toHaveProperty('team');
  });

  it('builds an address with a team and reads it back', () => {
    expect(seasonPath(7, 2025, 'weekly', 6)).toBe('/leagues/7/2025/weekly?team=6');
    expect(seasonPath(7, 2025, 'overview', 6)).toBe('/leagues/7/2025?team=6');
    expect(parseRoute('/leagues/7/2025/weekly', '?team=6')).toMatchObject({ team: 6 });
  });

  it('keeps the overview at the short address', () => {
    expect(seasonPath(12, 2024)).toBe('/leagues/12/2024');
    expect(seasonPath(12, 2024, 'luck')).toBe('/leagues/12/2024/luck');
  });
});

describe('Router', () => {
  it('follows the team in the query when navigating and replacing', () => {
    window.history.replaceState({}, '', '/');
    const router = new Router(window);

    router.navigate('/leagues/1/2025/weekly?team=4');
    expect(router.route).toMatchObject({ tab: 'weekly', team: 4 });
    expect(window.location.search).toBe('?team=4');

    router.replace('/leagues/1/2025/weekly?team=5');
    expect(router.route).toMatchObject({ team: 5 });
  });

  it('starts from the team in the current address', () => {
    window.history.replaceState({}, '', '/leagues/3/2025/weekly?team=2');

    expect(new Router(window).route).toMatchObject({ tab: 'weekly', team: 2 });
  });

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
