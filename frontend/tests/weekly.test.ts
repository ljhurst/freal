import { describe, expect, it } from 'vitest';
import { selectedTeamId, weeklyView } from '@/lib/season/weekly';
import { seasonReport } from './helpers';

describe('weeklyView', () => {
  const season = seasonReport();
  const view = weeklyView(season);

  it('has every week in order and every team in standing order', () => {
    expect(view.weeks).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    expect(view.teams.map((entry) => entry.team.name)).toEqual([
      'Team 5',
      'Team 4',
      'Team 6',
      'Team 2',
      'Team 1',
      'Team 7',
      'Team 8',
      'Team 3',
    ]);
  });

  it('gives each team a game per week, in week order, with the opponent', () => {
    const team6 = view.teams.find((entry) => entry.team.name === 'Team 6');

    expect(team6?.games).toHaveLength(14);
    expect(team6?.games.map((game) => game.week)).toEqual(view.weeks);
    for (const game of team6?.games ?? []) {
      expect(game.opponent?.team_id).not.toBe(team6?.team.team_id);
    }
  });

  it('decides each result from the two scores, and agrees with the record', () => {
    for (const entry of view.teams) {
      const wins = entry.games.filter((game) => game.result === 'win').length;
      const losses = entry.games.filter((game) => game.result === 'loss').length;
      expect(wins).toBe(entry.team.standing.wins);
      expect(losses).toBe(entry.team.standing.losses);
    }
  });

  it('takes the league median of each week', () => {
    const week1 = season.weeks
      .filter((row) => row.week === 1)
      .map((row) => row.points)
      .sort((a, b) => a - b);

    expect(view.medians.get(1)).toBeCloseTo(((week1[3] ?? 0) + (week1[4] ?? 0)) / 2, 6);
  });

  it('ranks the steadiest team first, using the swing the season report states', () => {
    const swings = view.strip.map((row) => row.swing);

    expect(swings).toEqual([...swings].sort((a, b) => a - b));
    expect(view.strip[0]?.swing).toBe(
      Math.min(...season.teams.map((team) => team.consistency.stdev)),
    );
    for (const row of view.strip) {
      expect(row.scores).toHaveLength(14);
      expect(row.best).toBe(Math.max(...row.scores));
      expect(row.worst).toBe(Math.min(...row.scores));
    }
  });

  it('starts on a team that is for real', () => {
    expect(view.defaultTeamId).toBe(5);
  });

  it('starts on the leader when nobody is for real', () => {
    const none = {
      ...season,
      teams: season.teams.map((team) => ({ ...team, stamp: null })),
    };

    expect(weeklyView(none).defaultTeamId).toBe(5);
  });

  it('copes with a team that has played fewer weeks', () => {
    const short = {
      ...season,
      weeks: season.weeks.filter((row) => !(row.team_id === 3 && row.week > 10)),
    };

    const entry = weeklyView(short).teams.find((candidate) => candidate.team.team_id === 3);

    expect(entry?.games).toHaveLength(10);
  });

  it('is empty before any games are played', () => {
    const empty = weeklyView({ ...season, teams: [], weeks: [] });

    expect(empty).toEqual({
      weeks: [],
      teams: [],
      medians: new Map(),
      strip: [],
      defaultTeamId: null,
    });
  });
});

describe('selectedTeamId', () => {
  const view = weeklyView(seasonReport());

  it('uses the team asked for when it is in the league', () => {
    expect(selectedTeamId(view, 3)).toBe(3);
  });

  it('falls back to the default for an unknown team or none', () => {
    expect(selectedTeamId(view, 999)).toBe(5);
    expect(selectedTeamId(view, undefined)).toBe(5);
  });
});
