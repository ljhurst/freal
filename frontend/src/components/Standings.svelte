<script lang="ts">
  import type { SeasonReport, TeamReport } from '@/lib/api/client';
  import LuckBar from '@/lib/charts/LuckBar.svelte';
  import Meter from '@/lib/charts/Meter.svelte';
  import Sparkline from '@/lib/charts/Sparkline.svelte';
  import { formatPoints, formatRecord } from '@/lib/format';
  import { byStanding } from '@/lib/season/highlights';
  import Chip from '@/lib/ui/Chip.svelte';
  import { verdictLabels } from '@/lib/verdict';

  let { teams, weeks }: { teams: readonly TeamReport[]; weeks: SeasonReport['weeks'] } = $props();

  const MIN_LUCK_SCALE = 2;

  const ranked = $derived([...teams].sort(byStanding));
  const luckScale = $derived(
    Math.max(MIN_LUCK_SCALE, ...teams.map((team) => Math.abs(team.luck.luck))),
  );
  const scoreRange = $derived({
    min: Math.min(...weeks.map((week) => week.points)),
    max: Math.max(...weeks.map((week) => week.points)),
  });

  function pointsOf(team: TeamReport): number[] {
    return weeks
      .filter((week) => week.team_id === team.team_id)
      .sort((a, b) => a.week - b.week)
      .map((week) => week.points);
  }
</script>

<div class="scroll">
  <table>
    <thead>
      <tr>
        <th scope="col">Team</th>
        <th scope="col">Record</th>
        <th scope="col" class="points">PF</th>
        <th scope="col" class="points">PA</th>
        <th scope="col" class="mark">Luck</th>
        <th scope="col" class="mark extra">Lineup</th>
        <th scope="col" class="mark extra">Trend</th>
        <th scope="col" class="verdict">Verdict</th>
      </tr>
    </thead>
    <tbody>
      {#each ranked as team (team.team_id)}
        {@const chips = verdictLabels(team)}
        <tr class:for-real={team.for_real}>
          <th scope="row">{team.name}</th>
          <td>{formatRecord(team.standing.wins, team.standing.losses, team.standing.ties)}</td>
          <td class="points">{formatPoints(team.standing.points_for)}</td>
          <td class="points">{formatPoints(team.standing.points_against)}</td>
          <td class="mark"><LuckBar luck={team.luck.luck} limit={luckScale} /></td>
          <td class="mark extra"><Meter value={team.efficiency.efficiency} label="Lineup efficiency" /></td>
          <td class="mark extra"><Sparkline points={pointsOf(team)} {...scoreRange} /></td>
          <td class="verdict">
            <span class="chips">
              {#each chips as chip (chip.label)}
                <Chip tone={chip.tone} label={chip.label} />
              {/each}
            </span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .scroll {
    overflow-x: auto;
    margin: 0 -1.25rem;
    padding: 0 1.25rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.75rem 0.9rem;
    text-align: right;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  th:first-child,
  th[scope='row'],
  .mark,
  .verdict {
    text-align: left;
  }

  th[scope='row'] {
    font-weight: 650;
  }

  thead th {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  tbody tr {
    transition: background var(--dur-fast) var(--ease-out);
  }

  tbody tr:hover {
    background: var(--surface-raised);
  }

  tbody tr.for-real {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }

  .chips {
    display: inline-flex;
    gap: 0.35rem;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  @media (max-width: 68rem) {
    .extra {
      display: none;
    }
  }

  @media (max-width: 56rem) {
    .points {
      display: none;
    }
  }

  /* On a phone the verdict matters more than the points, and there is no room for both. */
  @media (max-width: 36rem) {
    th,
    td {
      padding: 0.7rem 0.3rem;
    }
  }
</style>
