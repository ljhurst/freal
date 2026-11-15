import type { TeamReport } from '@/lib/api/client';

/** Standings order: most wins, then most points, then name so ties never shuffle. */
export function byStanding(a: TeamReport, b: TeamReport): number {
  return (
    b.standing.wins - a.standing.wins ||
    b.standing.points_for - a.standing.points_for ||
    a.name.localeCompare(b.name)
  );
}
