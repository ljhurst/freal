export type Route =
  | { name: 'home' }
  | { name: 'season'; leagueId: number; year: number }
  | { name: 'authCallback' }
  | { name: 'notFound' };

const SEASON_PATH = /^\/leagues\/(\d+)\/(\d{4})\/?$/;

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
    return { name: 'season', leagueId: Number(season[1]), year: Number(season[2]) };
  }
  return { name: 'notFound' };
}

export function seasonPath(leagueId: number, year: number): string {
  return `/leagues/${leagueId}/${year}`;
}
