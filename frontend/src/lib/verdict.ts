import type { TeamReport } from '@/lib/api/client';

export interface VerdictLabel {
  tone: 'lucky' | 'unlucky' | 'neutral';
  label: string;
}

/** The words for a team's verdict; a record that is what it looks like also says which way. */
export function verdictLabel(team: TeamReport): VerdictLabel {
  switch (team.verdict) {
    case 'lucky':
      return { tone: 'lucky', label: 'Lucky' };
    case 'unlucky':
      return { tone: 'unlucky', label: 'Unlucky' };
    case 'as_expected':
      return {
        tone: 'neutral',
        label: team.standing.wins >= team.standing.losses ? 'For real' : 'Rough, for real',
      };
  }
}
