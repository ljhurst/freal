<script lang="ts">
  import type { SeasonReport } from '@/lib/api/client';
  import ChartFrame from '@/lib/charts/ChartFrame.svelte';
  import ChartTable from '@/lib/charts/ChartTable.svelte';
  import LineupBars from '@/lib/charts/LineupBars.svelte';
  import { formatPercent, formatPoints } from '@/lib/format';
  import { teamLabel } from '@/lib/season/champion';
  import { lineupView } from '@/lib/season/lineups';

  let { season }: { season: SeasonReport } = $props();

  const view = $derived(lineupView(season));
</script>

{#if view.rows.length === 0}
  <p class="empty">No lineups have been set yet.</p>
{:else}
  <ChartFrame title="Who sets the best lineup?" index={0}>
    {#snippet help()}
      <p>
        Each week the best lineup a roster allowed is worked out. The bar adds those up: the solid
        part is what the team scored, and the hatched part is the points it missed by its lineup
        choices.
      </p>
      <p>The percentage is points scored divided by the best possible.</p>
    {/snippet}
    {#snippet chart()}
      <LineupBars {view} />
    {/snippet}
    {#snippet table()}
      <ChartTable
        caption="Points scored, best possible lineup, points missed and efficiency for each team"
        columns={[
          { label: 'Team' },
          { label: 'Points', numeric: true },
          { label: 'Best possible', numeric: true },
          { label: 'Points missed', numeric: true },
          { label: 'Efficiency', numeric: true },
        ]}
        rows={view.rows.map((row) => [
          teamLabel(row.team),
          formatPoints(row.scored),
          formatPoints(row.best),
          formatPoints(row.missed),
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
