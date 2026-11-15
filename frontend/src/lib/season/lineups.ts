import type { SeasonReport, TeamReport } from '@/lib/api/client';
import { byStanding } from '@/lib/season/order';

export interface LineupRow {
  team: TeamReport;
  scored: number;
  /** What the best possible lineup would have scored. */
  best: number;
  benched: number;
  efficiency: number;
}

export interface LineupView {
  /** Best manager first. */
  rows: LineupRow[];
  /** The longest bar, so every bar shares one scale. */
  max: number;
}

/** Each team's lineup points against the best it could have set, best manager first. */
export function lineupView(season: SeasonReport): LineupView {
  const rows = season.teams
    .filter((team) => team.efficiency.optimal_points > 0)
    .map((team) => ({
      team,
      scored: team.efficiency.points,
      best: team.efficiency.optimal_points,
      benched: team.efficiency.left_on_bench,
      efficiency: team.efficiency.efficiency,
    }))
    .sort((a, b) => b.efficiency - a.efficiency || byStanding(a.team, b.team));
  return { rows, max: Math.max(0, ...rows.map((row) => row.best)) };
}
