<script lang="ts">
  import AxisEnds from '@/lib/charts/AxisEnds.svelte';
  import ChartRows from '@/lib/charts/ChartRows.svelte';
  import Legend from '@/lib/charts/Legend.svelte';
  import { linearScale } from '@/lib/charts/scales';
  import { formatPoints, formatSigned } from '@/lib/format';
  import { isChampion, teamLabel } from '@/lib/season/champion';
  import type { ScheduleView } from '@/lib/season/luckMap';

  let { view }: { view: ScheduleView } = $props();

  const values = $derived(view.rows.map((row) => row.opponentPoints));
  const low = $derived(Math.floor(Math.min(...values) - 1));
  const high = $derived(Math.ceil(Math.max(...values) + 1));
  const percent = $derived(linearScale([low, high], [0, 100]));

  function tone(difference: number): 'helped' | 'hurt' | 'even' {
    return difference < 0 ? 'helped' : difference > 0 ? 'hurt' : 'even';
  }

  function sentence(row: ScheduleView['rows'][number]): string {
    const gap = Math.abs(row.difference).toFixed(1);
    const how =
      row.difference < 0
        ? `${gap} points easier than average`
        : row.difference > 0
          ? `${gap} points tougher than average`
          : 'an average schedule';
    return `${teamLabel(row.team)} faced ${row.opponentPoints.toFixed(1)} points per game, ${how}`;
  }
</script>

<ChartRows
  label="Average opponent points for each team, easiest schedule first"
  rows={view.rows}
  key={(row) => row.team.team_id}
  name={(row) => row.team.name}
  champion={(row) => isChampion(row.team)}
  describe={sentence}
  rowHeight="2rem"
  guide
>
  {#snippet headName()}Avg opponent points{/snippet}
  {#snippet headTrack()}
    <AxisEnds
      {low}
      {high}
      marker={{
        at: percent(view.leagueAverage),
        label: `League average ${formatPoints(view.leagueAverage)}`,
      }}
    />
  {/snippet}
  {#snippet track(row)}
    <span class="average-line" style:left="{percent(view.leagueAverage)}%"></span>
    <span class="dot {tone(row.difference)}" style:left="{percent(row.opponentPoints)}%"></span>
  {/snippet}
  {#snippet value(row)}
    {formatPoints(row.opponentPoints)}
    <span class="difference">{formatSigned(row.difference)}</span>
  {/snippet}
</ChartRows>

<Legend
  items={[
    { label: 'Easier than average: the schedule helped', kind: 'lucky' },
    { label: 'Tougher than average: it hurt', kind: 'unlucky' },
  ]}
/>

<style>
  .average-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0;
    border-left: 1.5px dashed var(--axis);
  }

  .dot {
    position: absolute;
    top: 50%;
    width: 0.95rem;
    height: 0.95rem;
    margin: -0.475rem 0 0 -0.475rem;
    border: 2px solid var(--surface);
    border-radius: 50%;
    animation: pop var(--dur-slow) var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 45ms);
  }

  .helped {
    background: var(--lucky);
  }

  .hurt {
    background: var(--unlucky);
  }

  .even {
    background: var(--neutral);
  }

  .difference {
    margin-left: 0.5rem;
    color: var(--muted);
    font-size: 0.82rem;
  }
</style>
