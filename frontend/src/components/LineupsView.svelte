<script lang="ts">
  import type { SeasonReport } from '@/lib/api/client';
  import ChartFrame from '@/lib/charts/ChartFrame.svelte';
  import ChartTable from '@/lib/charts/ChartTable.svelte';
  import LineupBars from '@/lib/charts/LineupBars.svelte';
  import { formatPercent, formatPoints } from '@/lib/format';
  import { lineupView } from '@/lib/season/lineups';

  let { season }: { season: SeasonReport } = $props();

  const view = $derived(lineupView(season));
</script>

{#if view.rows.length === 0}
  <p class="empty">No lineups have been set yet.</p>
{:else}
  <ChartFrame title="Who sets the best lineup?" index={0}>
    {#snippet chart()}
      <LineupBars {view} />
    {/snippet}
    {#snippet table()}
      <ChartTable
        caption="Points scored, best possible lineup, points left on the bench and efficiency for each team"
        columns={[
          { label: 'Team' },
          { label: 'Points', numeric: true },
          { label: 'Best possible', numeric: true },
          { label: 'Left on bench', numeric: true },
          { label: 'Efficiency', numeric: true },
        ]}
        rows={view.rows.map((row) => [
          row.team.name,
          formatPoints(row.scored),
          formatPoints(row.best),
          formatPoints(row.benched),
          formatPercent(row.efficiency),
        ])}
      />
    {/snippet}
  </ChartFrame>
{/if}

<style>
  .empty {
    color: var(--muted);
  }
</style>
