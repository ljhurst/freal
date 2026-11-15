<script lang="ts">
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import type { TeamReport } from '@/lib/api/client';
  import { formatPoints, formatRecord, formatSigned } from '@/lib/format';
  import { useServices } from '@/lib/services';

  let { leagueId, year }: { leagueId: number; year: number } = $props();

  const { api } = useServices();
  const report = $derived(api.season(leagueId, year));

  function byStanding(a: TeamReport, b: TeamReport): number {
    return b.standing.wins - a.standing.wins || b.standing.points_for - a.standing.points_for;
  }
</script>

{#await report}
  <p class="status" role="status">Loading the {year} season…</p>
{:then season}
  <h1>{season.name}</h1>
  <p class="subtitle">{season.year} season</p>
  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th scope="col">Team</th>
          <th scope="col">Record</th>
          <th scope="col">PF</th>
          <th scope="col">PA</th>
          <th scope="col">Luck</th>
        </tr>
      </thead>
      <tbody>
        {#each [...season.teams].sort(byStanding) as team (team.team_id)}
          <tr>
            <th scope="row">{team.name}</th>
            <td>{formatRecord(team.standing.wins, team.standing.losses, team.standing.ties)}</td>
            <td>{formatPoints(team.standing.points_for)}</td>
            <td>{formatPoints(team.standing.points_against)}</td>
            <td>{formatSigned(team.luck.luck)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:catch error}
  <ErrorPanel {error} />
{/await}

<style>
  .status,
  .subtitle {
    color: var(--muted);
  }

  .scroll {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.7rem 1rem;
    text-align: right;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  th:first-child,
  th[scope='row'] {
    text-align: left;
    font-weight: 600;
  }

  thead th {
    color: var(--muted);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  tbody tr:last-child > * {
    border-bottom: 0;
  }
</style>
