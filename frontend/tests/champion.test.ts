import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import { isChampion, teamLabel } from '@/lib/season/champion';
import { seasonReport } from './helpers';

const team = seasonReport().teams[0] as TeamReport;

describe('isChampion', () => {
  it('is true only for the team that finished first', () => {
    expect(isChampion({ ...team, final_rank: 1 })).toBe(true);
    expect(isChampion({ ...team, final_rank: 2 })).toBe(false);
    expect(isChampion({ ...team, final_rank: null })).toBe(false);
  });
});

describe('teamLabel', () => {
  it('names the champion as such and leaves other teams alone', () => {
    expect(teamLabel({ ...team, name: 'Team 6', final_rank: 1 })).toBe('Team 6 (champion)');
    expect(teamLabel({ ...team, name: 'Team 6', final_rank: 2 })).toBe('Team 6');
    expect(teamLabel({ ...team, name: 'Team 6', final_rank: null })).toBe('Team 6');
  });
});
