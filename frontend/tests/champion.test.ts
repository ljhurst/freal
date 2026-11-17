import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import { isChampion } from '@/lib/season/champion';
import { seasonReport } from './helpers';

const team = seasonReport().teams[0] as TeamReport;

describe('isChampion', () => {
  it('is true only for the team that finished first', () => {
    expect(isChampion({ ...team, final_rank: 1 })).toBe(true);
    expect(isChampion({ ...team, final_rank: 2 })).toBe(false);
    expect(isChampion({ ...team, final_rank: null })).toBe(false);
  });
});
