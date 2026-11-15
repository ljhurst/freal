import type { SeasonReport, TeamReport } from '@/lib/api/client';
import { byStanding } from '@/lib/season/order';

export type Polarity = 'lucky' | 'unlucky' | 'even';

export interface LuckDot {
  team: TeamReport;
  expected: number;
  actual: number;
  polarity: Polarity;
}

export interface ScheduleRow {
  team: TeamReport;
  opponentPoints: number;
  /** Opponent points minus the league average: negative means an easier schedule. */
  difference: number;
}

export interface ScheduleView {
  rows: ScheduleRow[];
  leagueAverage: number;
}

/** One dot per team: the wins its scoring should have earned (expected) against the wins in its record (actual). */
export function luckDots(season: SeasonReport): LuckDot[] {
  return [...season.teams].sort(byStanding).map((team) => ({
    team,
    expected: team.luck.expected_wins,
    actual: team.luck.expected_wins + team.luck.luck,
    polarity: team.verdict === 'as_expected' ? 'even' : team.verdict,
  }));
}

/** The easiest schedule first, with each team's gap to the league average. */
export function scheduleView(season: SeasonReport): ScheduleView {
  const teams = [...season.teams].sort(byStanding);
  if (teams.length === 0) {
    return { rows: [], leagueAverage: 0 };
  }
  const leagueAverage =
    teams.reduce((sum, team) => sum + team.schedule.average_opponent_points, 0) / teams.length;
  const rows = teams
    .map((team) => ({
      team,
      opponentPoints: team.schedule.average_opponent_points,
      difference: team.schedule.average_opponent_points - leagueAverage,
    }))
    .sort((a, b) => a.difference - b.difference);
  return { rows, leagueAverage };
}

/** Both axes share a domain, so the "actual matches expected" diagonal is a true y = x. */
export function sharedDomain(dots: readonly LuckDot[]): [number, number] {
  if (dots.length === 0) {
    return [0, 1];
  }
  const values = dots.flatMap((dot) => [dot.expected, dot.actual]);
  return [Math.max(0, Math.floor(Math.min(...values) - 0.5)), Math.ceil(Math.max(...values) + 0.5)];
}
