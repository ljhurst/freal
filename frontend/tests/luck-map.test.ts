import { describe, expect, it } from 'vitest';
import { luckDots, scheduleView, sharedDomain } from '@/lib/season/luckMap';
import { seasonReport } from './helpers';

describe('luckDots', () => {
  const season = seasonReport();
  const dots = luckDots(season);

  it('has one dot per team, in standing order', () => {
    expect(dots.map((dot) => dot.team.name)).toEqual([
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

  it('plots actual wins as the record the team really has', () => {
    for (const dot of dots) {
      expect(dot.actual).toBeCloseTo(dot.team.standing.wins + dot.team.standing.ties / 2, 6);
    }
  });

  it('colors a dot by how the record compares with the scoring', () => {
    const polarity = Object.fromEntries(dots.map((dot) => [dot.team.name, dot.polarity]));

    expect(polarity).toMatchObject({
      'Team 5': 'lucky',
      'Team 4': 'lucky',
      'Team 6': 'unlucky',
      'Team 8': 'unlucky',
      'Team 2': 'even',
      'Team 3': 'even',
    });
  });

  it('has nothing to plot before any games are played', () => {
    expect(luckDots({ ...season, teams: [], weeks: [] })).toEqual([]);
  });
});

describe('sharedDomain', () => {
  it('covers every expected and actual win with room around them', () => {
    const [low, high] = sharedDomain(luckDots(seasonReport()));

    expect(low).toBeLessThanOrEqual(2);
    expect(high).toBeGreaterThanOrEqual(14);
    expect(Number.isInteger(low) && Number.isInteger(high)).toBe(true);
  });

  it('never starts below zero wins', () => {
    const season = seasonReport();
    const dots = luckDots(season).map((dot) => ({ ...dot, expected: 0.2, actual: 0.2 }));

    expect(sharedDomain(dots)[0]).toBe(0);
  });

  it('has a sensible domain with no teams', () => {
    expect(sharedDomain([])).toEqual([0, 1]);
  });
});

describe('scheduleView', () => {
  const view = scheduleView(seasonReport());

  it('lists the easiest schedule first', () => {
    const points = view.rows.map((row) => row.opponentPoints);

    expect(points).toEqual([...points].sort((a, b) => a - b));
    expect(view.rows[0]?.team.name).toBe('Team 5');
  });

  it('measures each team against the league average', () => {
    const mean = view.rows.reduce((sum, row) => sum + row.opponentPoints, 0) / view.rows.length;

    expect(view.leagueAverage).toBeCloseTo(mean, 6);
    for (const row of view.rows) {
      expect(row.edge).toBeCloseTo(view.leagueAverage - row.opponentPoints, 6);
    }
    expect(view.rows.reduce((sum, row) => sum + row.edge, 0)).toBeCloseTo(0, 6);
  });

  it('is empty with no teams', () => {
    expect(scheduleView({ ...seasonReport(), teams: [], weeks: [] })).toEqual({
      rows: [],
      leagueAverage: 0,
    });
  });
});
