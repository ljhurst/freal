<script lang="ts">
  import type { TeamReport } from '@/lib/api/client';
  import { formatPoints, formatRecord, formatSigned } from '@/lib/format';
  import Chip from '@/lib/ui/Chip.svelte';
  import { verdictLabel } from '@/lib/verdict';

  let { teams }: { teams: readonly TeamReport[] } = $props();

  const ranked = $derived([...teams].sort(byStanding));

  function byStanding(a: TeamReport, b: TeamReport): number {
    return b.standing.wins - a.standing.wins || b.standing.points_for - a.standing.points_for;
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
        <th scope="col">Luck</th>
        <th scope="col" class="verdict">Verdict</th>
      </tr>
    </thead>
    <tbody>
      {#each ranked as team (team.team_id)}
        {@const verdict = verdictLabel(team)}
        <tr>
          <th scope="row">{team.name}</th>
          <td>{formatRecord(team.standing.wins, team.standing.losses, team.standing.ties)}</td>
          <td class="points">{formatPoints(team.standing.points_for)}</td>
          <td class="points">{formatPoints(team.standing.points_against)}</td>
          <td>{formatSigned(team.luck.luck)}</td>
          <td class="verdict"><Chip tone={verdict.tone} label={verdict.label} /></td>
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

  tbody tr:last-child > * {
    border-bottom: 0;
  }

  /* On a phone the verdict matters more than the points, and there is no room for both. */
  @media (max-width: 36rem) {
    .points {
      display: none;
    }

    th,
    td {
      padding: 0.7rem 0.45rem;
    }
  }
</style>
