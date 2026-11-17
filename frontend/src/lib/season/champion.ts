import type { TeamReport } from '@/lib/api/client';

export function isChampion(team: TeamReport): boolean {
  return team.final_rank === 1;
}
