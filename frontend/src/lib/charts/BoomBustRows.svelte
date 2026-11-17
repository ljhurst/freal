<script lang="ts">
  import AxisEnds from '@/lib/charts/AxisEnds.svelte';
  import ChartRows from '@/lib/charts/ChartRows.svelte';
  import Legend from '@/lib/charts/Legend.svelte';
  import { linearScale } from '@/lib/charts/scales';
  import { formatPoints } from '@/lib/format';
  import { isChampion, teamLabel } from '@/lib/season/champion';
  import type { StripRow, WeeklyView } from '@/lib/season/weekly';

  let { view, selectedId }: { view: WeeklyView; selectedId: number } = $props();

  const all = $derived(view.strip.flatMap((row) => row.scores));
  const low = $derived(Math.floor((Math.min(...all) - 5) / 10) * 10);
  const high = $derived(Math.ceil((Math.max(...all) + 5) / 10) * 10);
  const percent = $derived(linearScale([low, high], [0, 100]));

  function sentence(row: StripRow): string {
    return `${teamLabel(row.team)} scored ${formatPoints(row.worst)} at worst and ${formatPoints(row.best)} at best, averaging ${formatPoints(row.mean)} with a typical swing of ${row.swing.toFixed(1)} points`;
  }
</script>

<ChartRows
  label="Weekly scores for each team, steadiest first"
  rows={view.strip}
  key={(row) => row.team.team_id}
  name={(row) => row.team.name}
  champion={(row) => isChampion(row.team)}
  describe={sentence}
  rowHeight="2.4rem"
  guide
  marked={(row) => row.team.team_id === selectedId}
>
  {#snippet headName()}Points each week{/snippet}
  {#snippet headTrack()}<AxisEnds {low} {high} />{/snippet}
  {#snippet track(row)}
    {#each row.scores as score, index (index)}
      <span
        class="dot"
        class:chosen={row.team.team_id === selectedId}
        style:left="{percent(score)}%"
      ></span>
    {/each}
    <span class="mean" style:left="{percent(row.mean)}%"></span>
  {/snippet}
  {#snippet value(row)}
    <strong>±{row.swing.toFixed(1)}</strong>
    <span class="cost">avg {formatPoints(row.mean)}</span>
  {/snippet}
</ChartRows>

<Legend
  items={[
    { label: 'One dot per week', kind: 'series' },
    { label: 'Selected team', kind: 'win' },
    { label: 'Average', kind: 'mean' },
  ]}
/>

<style>
  .dot {
    position: absolute;
    top: 50%;
    width: 0.7rem;
    height: 0.7rem;
    margin: -0.35rem 0 0 -0.35rem;
    border: 1px solid var(--surface);
    border-radius: 50%;
    background: var(--muted);
    opacity: 0.8;
  }

  .chosen {
    background: var(--accent);
    opacity: 1;
  }

  .mean {
    position: absolute;
    top: 18%;
    bottom: 18%;
    width: 0;
    border-left: 2px solid var(--text);
  }

  .cost {
    margin-left: 0.6rem;
    color: var(--muted);
    font-size: 0.82rem;
  }
</style>
