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
  /** Positive when the schedule was easier than the league's average. */
  edge: number;
}

export interface ScheduleView {
  rows: ScheduleRow[];
  leagueAverage: number;
}

/** One dot per team: what its scoring earned against what its record shows. */
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
      edge: leagueAverage - team.schedule.average_opponent_points,
    }))
    .sort((a, b) => b.edge - a.edge);
  return { rows, leagueAverage };
}

/** Both axes share a domain, so the "record matches scoring" diagonal is a true y = x. */
export function sharedDomain(dots: readonly LuckDot[]): [number, number] {
  if (dots.length === 0) {
    return [0, 1];
  }
  const values = dots.flatMap((dot) => [dot.expected, dot.actual]);
  return [Math.max(0, Math.floor(Math.min(...values) - 0.5)), Math.ceil(Math.max(...values) + 0.5)];
}
