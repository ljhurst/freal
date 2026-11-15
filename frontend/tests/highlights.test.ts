import { describe, expect, it } from 'vitest';
import type { SeasonReport, TeamReport } from '@/lib/api/client';
import { highlights } from '@/lib/season/highlights';
import { seasonReport } from './helpers';

function named(season: SeasonReport, name: string): TeamReport {
  return season.teams.find((team) => team.name === name) as TeamReport;
}

describe('highlights on the demo league', () => {
  const season = seasonReport();
  const result = highlights(season);

  it('stamps the teams that are for real, in standing order', () => {
    expect(result.stamped.map((team) => team.name)).toEqual(['Team 5', 'Team 6']);
  });

  it('picks the luckiest and unluckiest teams with their luck', () => {
    expect(result.luckiest?.team.name).toBe('Team 5');
    expect(result.luckiest?.value).toBeCloseTo(2.3, 1);
    expect(result.unluckiest?.team.name).toBe('Team 6');
    expect(result.unluckiest?.value).toBeCloseTo(-2.0, 1);
  });

  it('picks the most efficient manager and the steadiest team', () => {
    const efficient = [...season.teams].sort(
      (a, b) => b.efficiency.efficiency - a.efficiency.efficiency,
    )[0];
    const steady = [...season.teams].sort((a, b) => a.consistency.stdev - b.consistency.stdev)[0];
    expect(result.mostEfficient?.team.team_id).toBe(efficient?.team_id);
    expect(result.steadiest?.team.team_id).toBe(steady?.team_id);
    expect(result.steadiest?.value).toBe(steady?.consistency.stdev);
  });

  it('finds the highest-scoring week and who had it', () => {
    const top = [...season.weeks].sort((a, b) => b.points - a.points)[0];
    expect(result.topWeek).toMatchObject({ week: top?.week, value: top?.points });
    expect(result.topWeek?.team.team_id).toBe(top?.team_id);
  });
});

describe('highlights when the data is thin', () => {
  it('has nothing to call out before any games are played', () => {
    const season = { ...seasonReport(), teams: [], weeks: [] };

    expect(highlights(season)).toEqual({
      stamped: [],
      luckiest: null,
      unluckiest: null,
      mostEfficient: null,
      steadiest: null,
      topWeek: null,
    });
  });

  it('does not call a team lucky or unlucky when nobody is', () => {
    const base = seasonReport();
    const even = {
      ...base,
      teams: base.teams.map((team) => ({ ...team, luck: { ...team.luck, luck: 0 } })),
    };

    const result = highlights(even);

    expect(result.luckiest).toBeNull();
    expect(result.unluckiest).toBeNull();
  });

  it('breaks a tie in favor of the better record', () => {
    const base = seasonReport();
    const tied = {
      ...base,
      teams: base.teams.map((team) => ({
        ...team,
        efficiency: { ...team.efficiency, efficiency: 0.9 },
      })),
    };

    expect(highlights(tied).mostEfficient?.team).toEqual(named(tied, 'Team 5'));
  });
});
