export const SEASON_TABS = ['overview', 'luck', 'lineups', 'weekly'] as const;
export type SeasonTab = (typeof SEASON_TABS)[number];

export type Route =
  | { name: 'home' }
  | { name: 'season'; leagueId: number; year: number; tab: SeasonTab }
  | { name: 'authCallback' }
  | { name: 'notFound' };

const SEASON_PATH = new RegExp(`^/leagues/(\\d+)/(\\d{4})(?:/(${SEASON_TABS.join('|')}))?/?$`);

export class Router {
  route = $state<Route>({ name: 'home' });

  constructor(private readonly win: Window) {
    this.route = parseRoute(win.location.pathname);
    win.addEventListener('popstate', () => {
      this.route = parseRoute(win.location.pathname);
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
    return parseRoute(new URL(path, this.win.location.origin).pathname);
  }
}

export function parseRoute(pathname: string): Route {
  if (pathname === '/') {
    return { name: 'home' };
  }
  if (pathname === '/auth/callback') {
    return { name: 'authCallback' };
  }
  const season = SEASON_PATH.exec(pathname);
  if (season) {
    return {
      name: 'season',
      leagueId: Number(season[1]),
      year: Number(season[2]),
      tab: (season[3] as SeasonTab | undefined) ?? 'overview',
    };
  }
  return { name: 'notFound' };
}

export function seasonPath(leagueId: number, year: number, tab: SeasonTab = 'overview'): string {
  const base = `/leagues/${leagueId}/${year}`;
  return tab === 'overview' ? base : `${base}/${tab}`;
}
