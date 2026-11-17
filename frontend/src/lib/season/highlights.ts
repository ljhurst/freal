import type { SeasonReport, TeamReport } from '@/lib/api/client';
import { byStanding } from '@/lib/season/order';
import { isForReal } from '@/lib/verdict';

export interface Pick {
  team: TeamReport;
  value: number;
}

export interface TopWeek extends Pick {
  week: number;
}

export interface Highlights {
  forReal: TeamReport[];
  inTheHunt: TeamReport[];
  luckiest: Pick | null;
  unluckiest: Pick | null;
  mostEfficient: Pick | null;
  steadiest: Pick | null;
  topWeek: TopWeek | null;
}

/** What the overview calls out: the teams that are for real or in the hunt, and the season's standouts. */
export function highlights(season: SeasonReport): Highlights {
  const teams = [...season.teams].sort(byStanding);
  const luckiest = best(teams, (team) => team.luck.luck);
  const unluckiest = best(teams, (team) => -team.luck.luck);
  return {
    forReal: teams.filter(isForReal),
    inTheHunt: teams.filter((team) => team.stamp === 'in_the_hunt'),
    luckiest: luckiest && luckiest.value > 0 ? luckiest : null,
    unluckiest:
      unluckiest && unluckiest.value > 0 ? { ...unluckiest, value: -unluckiest.value } : null,
    mostEfficient: best(teams, (team) => team.efficiency.efficiency),
    steadiest: best(
      teams,
      (team) => -team.consistency.stdev,
      (team) => team.consistency.stdev,
    ),
    topWeek: topWeek(season, teams),
  };
}

function best(
  teams: readonly TeamReport[],
  score: (team: TeamReport) => number,
  shown: (team: TeamReport) => number = score,
): Pick | null {
  let winner: TeamReport | null = null;
  for (const team of teams) {
    if (winner === null || score(team) > score(winner)) {
      winner = team;
    }
  }
  return winner && { team: winner, value: shown(winner) };
}

function topWeek(season: SeasonReport, teams: readonly TeamReport[]): TopWeek | null {
  let top: SeasonReport['weeks'][number] | null = null;
  for (const week of season.weeks) {
    if (top === null || week.points > top.points) {
      top = week;
    }
  }
  const team = top && teams.find((candidate) => candidate.team_id === top.team_id);
  return top && team ? { team, week: top.week, value: top.points } : null;
}
