export const SEASON_TABS = ['overview', 'luck', 'lineups', 'weekly'] as const;
export type SeasonTab = (typeof SEASON_TABS)[number];

export type Route =
  | { name: 'home' }
  | { name: 'season'; leagueId: number; year: number; tab: SeasonTab; team?: number }
  | { name: 'authCallback' }
  | { name: 'notFound' };

const SEASON_PATH = new RegExp(`^/leagues/(\\d+)/(\\d{4})(?:/(${SEASON_TABS.join('|')}))?/?$`);

export class Router {
  route = $state<Route>({ name: 'home' });

  constructor(private readonly win: Window) {
    this.route = parseRoute(win.location.pathname, win.location.search);
    win.addEventListener('popstate', () => {
      this.route = parseRoute(win.location.pathname, win.location.search);
    });
  }

  navigate(path: string): void {
    this.win.history.pushState({}, '', path);
    this.route = this.parse(path);
  }

  /** Like navigate, but leaves no history entry, so Back skips the page being left. */
  replace(path: string): void {
    this.win.history.replaceState({}, '', path);
    this.route = this.parse(path);
  }

  private parse(path: string): Route {
    const url = new URL(path, this.win.location.origin);
    return parseRoute(url.pathname, url.search);
  }
}

export function parseRoute(pathname: string, search = ''): Route {
  if (pathname === '/') {
    return { name: 'home' };
  }
  if (pathname === '/auth/callback') {
    return { name: 'authCallback' };
  }
  const season = SEASON_PATH.exec(pathname);
  if (season) {
    const team = teamParam(search);
    return {
      name: 'season',
      leagueId: Number(season[1]),
      year: Number(season[2]),
      tab: (season[3] as SeasonTab | undefined) ?? 'overview',
      ...(team === undefined ? {} : { team }),
    };
  }
  return { name: 'notFound' };
}

export function seasonPath(
  leagueId: number,
  year: number,
  tab: SeasonTab = 'overview',
  team?: number,
): string {
  const base = `/leagues/${leagueId}/${year}`;
  const path = tab === 'overview' ? base : `${base}/${tab}`;
  return team === undefined ? path : `${path}?team=${team}`;
}

function teamParam(search: string): number | undefined {
  const value = new URLSearchParams(search).get('team');
  return value !== null && /^\d+$/.test(value) ? Number(value) : undefined;
}

/** Where a team's own story lives: its week by week, with that team selected. */
export function teamPath(leagueId: number, year: number, teamId: number): string {
  return seasonPath(leagueId, year, 'weekly', teamId);
}
