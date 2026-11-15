import type { TeamReport } from '@/lib/api/client';

export type Tone = 'forReal' | 'lucky' | 'unlucky' | 'neutral';

export interface VerdictLabel {
  tone: Tone;
  label: string;
}

/** The chips for a team: the stamp if it earned one, how luck treated it, or else how good it is. */
export function verdictLabels(team: TeamReport): VerdictLabel[] {
  const chips: VerdictLabel[] = [];
  if (team.for_real) chips.push({ tone: 'forReal', label: 'For real' });
  if (team.verdict === 'lucky') chips.push({ tone: 'lucky', label: 'Lucky' });
  if (team.verdict === 'unlucky') chips.push({ tone: 'unlucky', label: 'Unlucky' });
  if (chips.length === 0) chips.push({ tone: 'neutral', label: STRENGTH_WORDS[team.strength] });
  return chips;
}

const STRENGTH_WORDS = {
  good: 'Good',
  average: 'Average',
  bad: 'Bad',
} as const satisfies Record<TeamReport['strength'], string>;
