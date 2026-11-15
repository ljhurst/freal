import type { SeasonReport, TeamReport } from '@/lib/api/client';
import { byStanding } from '@/lib/season/order';

export type Result = 'win' | 'loss' | 'tie';

export interface Game {
  week: number;
  points: number;
  opponent: TeamReport | null;
  opponentPoints: number;
  result: Result;
}

export interface TeamGames {
  team: TeamReport;
  /** In week order. */
  games: Game[];
}

export interface StripRow {
  team: TeamReport;
  scores: number[];
  mean: number;
  /** One standard deviation of the weekly scores. */
  swing: number;
  best: number;
  worst: number;
}

export interface WeeklyView {
  weeks: number[];
  /** In standing order. */
  teams: TeamGames[];
  /** The league's median score in each week, by week. */
  medians: Map<number, number>;
  /** Steadiest first. */
  strip: StripRow[];
  /** The team to show first: one that is for real, else the leader. */
  defaultTeamId: number | null;
}

export function weeklyView(season: SeasonReport): WeeklyView {
  const standing = [...season.teams].sort(byStanding);
  const byId = new Map(standing.map((team) => [team.team_id, team]));

  const teams: TeamGames[] = standing.map((team) => ({
    team,
    games: season.weeks
      .filter((row) => row.team_id === team.team_id)
      .sort((a, b) => a.week - b.week)
      .map((row) => ({
        week: row.week,
        points: row.points,
        opponent: byId.get(row.opponent_id) ?? null,
        opponentPoints: row.opponent_points,
        result: resultOf(row.points, row.opponent_points),
      })),
  }));

  const weeks = [...new Set(season.weeks.map((row) => row.week))].sort((a, b) => a - b);
  const medians = new Map(
    weeks.map((week) => [
      week,
      median(season.weeks.filter((row) => row.week === week).map((row) => row.points)),
    ]),
  );

  const strip = teams
    .filter((entry) => entry.games.length > 0)
    .map((entry) => {
      const scores = entry.games.map((game) => game.points);
      return {
        team: entry.team,
        scores,
        mean: entry.team.consistency.mean,
        swing: entry.team.consistency.stdev,
        best: Math.max(...scores),
        worst: Math.min(...scores),
      };
    })
    .sort((a, b) => a.swing - b.swing || byStanding(a.team, b.team));

  const leader = standing.find((team) => team.for_real) ?? standing[0];
  return { weeks, teams, medians, strip, defaultTeamId: leader?.team_id ?? null };
}

/** The team to highlight: the one asked for if it is in the league, else the default. */
export function selectedTeamId(view: WeeklyView, requested: number | undefined): number | null {
  const known =
    requested !== undefined && view.teams.some((entry) => entry.team.team_id === requested);
  return known ? requested : view.defaultTeamId;
}

function resultOf(points: number, opponentPoints: number): Result {
  if (points > opponentPoints) return 'win';
  if (points < opponentPoints) return 'loss';
  return 'tie';
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}
