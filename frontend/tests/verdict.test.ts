import { describe, expect, it } from 'vitest';
import type { TeamReport } from '@/lib/api/client';
import { verdictLabel } from '@/lib/verdict';
import { seasonReport } from './helpers';

function team(verdict: TeamReport['verdict'], wins: number, losses: number): TeamReport {
  const base = seasonReport().teams[0] as TeamReport;
  return { ...base, verdict, standing: { ...base.standing, wins, losses } };
}

describe('verdictLabel', () => {
  it('names lucky and unlucky teams whatever their record', () => {
    expect(verdictLabel(team('lucky', 13, 1))).toEqual({ tone: 'lucky', label: 'Lucky' });
    expect(verdictLabel(team('unlucky', 8, 6))).toEqual({ tone: 'unlucky', label: 'Unlucky' });
  });

  it('calls a winning record that is earned "For real"', () => {
    expect(verdictLabel(team('as_expected', 9, 5))).toEqual({ tone: 'neutral', label: 'For real' });
    expect(verdictLabel(team('as_expected', 7, 7)).label).toBe('For real');
  });

  it('is honest about a losing record that is earned', () => {
    expect(verdictLabel(team('as_expected', 2, 12))).toEqual({
      tone: 'neutral',
      label: 'Rough, for real',
    });
  });
});
