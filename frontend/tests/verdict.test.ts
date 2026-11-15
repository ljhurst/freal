import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import { verdictLabels } from '@/lib/verdict';
import { seasonReport } from './helpers';

function team(overrides: Partial<TeamReport>): TeamReport {
  return { ...(seasonReport().teams[0] as TeamReport), ...overrides };
}

describe('verdictLabels', () => {
  it('stamps a good team, and says if luck held it back', () => {
    expect(
      verdictLabels(team({ for_real: true, strength: 'good', verdict: 'as_expected' })),
    ).toEqual([{ tone: 'forReal', label: 'For real' }]);
    expect(verdictLabels(team({ for_real: true, strength: 'good', verdict: 'unlucky' }))).toEqual([
      { tone: 'forReal', label: 'For real' },
      { tone: 'unlucky', label: 'Unlucky' },
    ]);
  });

  it('stamps a lucky team too when its scoring is good, and says it was lucky', () => {
    expect(verdictLabels(team({ for_real: true, strength: 'good', verdict: 'lucky' }))).toEqual([
      { tone: 'forReal', label: 'For real' },
      { tone: 'lucky', label: 'Lucky' },
    ]);
  });

  it('does not stamp a lucky team whose scoring is only average', () => {
    expect(verdictLabels(team({ for_real: false, strength: 'average', verdict: 'lucky' }))).toEqual(
      [{ tone: 'lucky', label: 'Lucky' }],
    );
  });

  it('says how good a team is when luck has nothing to add', () => {
    expect(
      verdictLabels(team({ for_real: false, strength: 'average', verdict: 'as_expected' })),
    ).toEqual([{ tone: 'neutral', label: 'Average' }]);
    expect(
      verdictLabels(team({ for_real: false, strength: 'bad', verdict: 'as_expected' })),
    ).toEqual([{ tone: 'neutral', label: 'Bad' }]);
  });
});
