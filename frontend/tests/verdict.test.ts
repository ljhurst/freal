import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import { isForReal, verdictLabels } from '@/lib/verdict';
import { seasonReport } from './helpers';

function team(overrides: Partial<TeamReport>): TeamReport {
  return { ...(seasonReport().teams[0] as TeamReport), ...overrides };
}

describe('verdictLabels', () => {
  it('stamps a team that is for real, and says if luck held it back', () => {
    expect(
      verdictLabels(team({ stamp: 'for_real', strength: 'good', verdict: 'as_expected' })),
    ).toEqual([
      { tone: 'neutral', label: 'Good' },
      { tone: 'forReal', label: 'For real' },
    ]);
    expect(
      verdictLabels(team({ stamp: 'for_real', strength: 'good', verdict: 'unlucky' })),
    ).toEqual([
      { tone: 'unlucky', label: 'Unlucky' },
      { tone: 'forReal', label: 'For real' },
    ]);
  });

  it('stamps a lucky team too when its scoring is that good, and says it was lucky', () => {
    expect(verdictLabels(team({ stamp: 'for_real', strength: 'good', verdict: 'lucky' }))).toEqual([
      { tone: 'lucky', label: 'Lucky' },
      { tone: 'forReal', label: 'For real' },
    ]);
  });

  it('marks a team with a real shot as in the hunt, beside its read', () => {
    expect(
      verdictLabels(team({ stamp: 'in_the_hunt', strength: 'good', verdict: 'as_expected' })),
    ).toEqual([
      { tone: 'neutral', label: 'Good' },
      { tone: 'hunt', label: 'In the hunt' },
    ]);
    expect(
      verdictLabels(team({ stamp: 'in_the_hunt', strength: 'good', verdict: 'unlucky' })),
    ).toEqual([
      { tone: 'unlucky', label: 'Unlucky' },
      { tone: 'hunt', label: 'In the hunt' },
    ]);
  });

  it('calls a lucky team with weak scoring a fraud and keeps its lucky pill', () => {
    expect(verdictLabels(team({ stamp: 'fraud', strength: 'average', verdict: 'lucky' }))).toEqual([
      { tone: 'lucky', label: 'Lucky' },
      { tone: 'fraud', label: 'Fraud' },
    ]);
  });

  it('does not stamp a lucky team whose scoring is only average', () => {
    expect(verdictLabels(team({ stamp: null, strength: 'average', verdict: 'lucky' }))).toEqual([
      { tone: 'lucky', label: 'Lucky' },
    ]);
  });

  it('says how good a team is when luck has nothing to add', () => {
    expect(
      verdictLabels(team({ stamp: null, strength: 'average', verdict: 'as_expected' })),
    ).toEqual([{ tone: 'neutral', label: 'Average' }]);
    expect(verdictLabels(team({ stamp: null, strength: 'bad', verdict: 'as_expected' }))).toEqual([
      { tone: 'neutral', label: 'Bad' },
    ]);
  });
});

describe('isForReal', () => {
  it('is true only for the for-real stamp', () => {
    expect(isForReal(team({ stamp: 'for_real' }))).toBe(true);
    expect(isForReal(team({ stamp: 'in_the_hunt' }))).toBe(false);
    expect(isForReal(team({ stamp: 'fraud' }))).toBe(false);
    expect(isForReal(team({ stamp: null }))).toBe(false);
  });
});
