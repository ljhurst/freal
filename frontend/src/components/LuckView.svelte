<script lang="ts">
  import type { SeasonReport } from '@/lib/api/client';
  import ChartFrame from '@/lib/charts/ChartFrame.svelte';
  import ChartTable from '@/lib/charts/ChartTable.svelte';
  import LuckMap from '@/lib/charts/LuckMap.svelte';
  import ScheduleDotPlot from '@/lib/charts/ScheduleDotPlot.svelte';
  import { formatPoints, formatRecord, formatSigned } from '@/lib/format';
  import { luckDots, scheduleView } from '@/lib/season/luckMap';

  let { season }: { season: SeasonReport } = $props();

  const dots = $derived(luckDots(season));
  const schedule = $derived(scheduleView(season));
</script>

{#if dots.length === 0}
  <p class="empty">No games have been played yet.</p>
{:else}
  <div class="stack">
    <ChartFrame title="Who got the breaks?" eyebrow="What the scoring earned against the record" index={0}>
      {#snippet chart()}
        <LuckMap {dots} />
      {/snippet}
      {#snippet table()}
        <ChartTable
          caption="Wins the scoring earned, record and luck for each team"
          columns={[
            { label: 'Team' },
            { label: 'Record', numeric: true },
            { label: 'Scoring earned', numeric: true },
            { label: 'Luck', numeric: true },
          ]}
          rows={dots.map((dot) => [
            dot.team.name,
            formatRecord(dot.team.standing.wins, dot.team.standing.losses, dot.team.standing.ties),
            `${dot.expected.toFixed(1)} wins`,
            `${formatSigned(dot.team.luck.luck)} wins`,
          ])}
        />
      {/snippet}
    </ChartFrame>

    <ChartFrame title="Did the schedule help?" eyebrow="Average points scored against each team" index={1}>
      {#snippet chart()}
        <ScheduleDotPlot view={schedule} />
      {/snippet}
      {#snippet table()}
        <ChartTable
          caption="Average points scored against each team, easiest schedule first"
          columns={[
            { label: 'Team' },
            { label: 'Opponent points', numeric: true },
            { label: 'Easier than average by', numeric: true },
          ]}
          rows={schedule.rows.map((row) => [
            row.team.name,
            formatPoints(row.opponentPoints),
            formatSigned(row.edge),
          ])}
        />
      {/snippet}
    </ChartFrame>
  </div>
{/if}

<style>
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }

  .empty {
    color: var(--muted);
  }
</style>
