import type { TeamReport } from '@/lib/api/client';

export type Tone = 'forReal' | 'hunt' | 'fraud' | 'lucky' | 'unlucky' | 'neutral';

export interface VerdictLabel {
  tone: Tone;
  label: string;
}

/** The chips for a team: how luck treated it, or how good its scoring is, then its stamp. */
export function verdictLabels(team: TeamReport): VerdictLabel[] {
  const chips = [readChip(team)];
  if (team.stamp) chips.push(STAMP_CHIPS[team.stamp]);
  return chips;
}

export function isForReal(team: TeamReport): boolean {
  return team.stamp === 'for_real';
}

function readChip(team: TeamReport): VerdictLabel {
  if (team.verdict === 'lucky') return { tone: 'lucky', label: 'Lucky' };
  if (team.verdict === 'unlucky') return { tone: 'unlucky', label: 'Unlucky' };
  return { tone: 'neutral', label: STRENGTH_WORDS[team.strength] };
}

const STRENGTH_WORDS = {
  good: 'Good',
  average: 'Average',
  bad: 'Bad',
} as const satisfies Record<TeamReport['strength'], string>;

const STAMP_CHIPS = {
  for_real: { tone: 'forReal', label: 'For real' },
  in_the_hunt: { tone: 'hunt', label: 'In the hunt' },
  fraud: { tone: 'fraud', label: 'Fraud' },
} as const satisfies Record<NonNullable<TeamReport['stamp']>, VerdictLabel>;
