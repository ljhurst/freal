import type { TeamReport } from '@/lib/api/client';

export type Tone = 'forReal' | 'lucky' | 'unlucky' | 'neutral';

export interface VerdictLabel {
  tone: Tone;
  label: string;
}

/** The chips for a team: how luck treated it, or how good it is when luck did not matter, then the stamp. */
export function verdictLabels(team: TeamReport): VerdictLabel[] {
  const chips: VerdictLabel[] = [];
  if (team.verdict === 'lucky') chips.push({ tone: 'lucky', label: 'Lucky' });
  else if (team.verdict === 'unlucky') chips.push({ tone: 'unlucky', label: 'Unlucky' });
  else chips.push({ tone: 'neutral', label: STRENGTH_WORDS[team.strength] });
  if (team.for_real) chips.push({ tone: 'forReal', label: 'For real' });
  return chips;
}

const STRENGTH_WORDS = {
  good: 'Good',
  average: 'Average',
  bad: 'Bad',
} as const satisfies Record<TeamReport['strength'], string>;
