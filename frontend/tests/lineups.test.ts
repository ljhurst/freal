import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import { lineupView } from '@/lib/season/lineups';
import { seasonReport } from './helpers';

describe('lineupView', () => {
  const season = seasonReport();
  const view = lineupView(season);

  it('ranks the best manager first', () => {
    expect(view.rows.map((row) => row.team.name)).toEqual([
      'Team 6',
      'Team 4',
      'Team 5',
      'Team 2',
      'Team 7',
      'Team 1',
      'Team 8',
      'Team 3',
    ]);
  });

  it('has points scored plus points missed equal to the best possible lineup', () => {
    for (const row of view.rows) {
      expect(row.scored + row.missed).toBeCloseTo(row.best, 6);
      expect(row.efficiency).toBeCloseTo(row.scored / row.best, 6);
    }
  });

  it('puts every bar on one scale, set by the longest', () => {
    expect(view.max).toBe(Math.max(...view.rows.map((row) => row.best)));
    expect(view.max).toBeCloseTo(2267.6, 1);
  });

  it('breaks an efficiency tie in favor of the better record', () => {
    const tied = {
      ...season,
      teams: season.teams.map((team) => ({
        ...team,
        efficiency: { ...team.efficiency, efficiency: 0.9 },
      })),
    };

    expect(lineupView(tied).rows[0]?.team.name).toBe('Team 5');
  });

  it('leaves out a team that has not set a lineup yet', () => {
    const early = {
      ...season,
      teams: season.teams.map((team: TeamReport, index: number) =>
        index === 0
          ? { ...team, efficiency: { ...team.efficiency, points: 0, optimal_points: 0 } }
          : team,
      ),
    };

    const rows = lineupView(early).rows;

    expect(rows).toHaveLength(7);
    expect(rows.some((row) => row.team.team_id === season.teams[0]?.team_id)).toBe(false);
  });

  it('is empty before any games are played', () => {
    expect(lineupView({ ...season, teams: [], weeks: [] })).toEqual({ rows: [], max: 0 });
  });
});
