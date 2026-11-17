<script lang="ts">
  import ChartRows from '@/lib/charts/ChartRows.svelte';
  import Legend from '@/lib/charts/Legend.svelte';
  import { linearScale } from '@/lib/charts/scales';
  import { formatPercent, formatPoints } from '@/lib/format';
  import { isChampion, teamLabel } from '@/lib/season/champion';
  import type { LineupRow, LineupView } from '@/lib/season/lineups';

  let { view }: { view: LineupView } = $props();

  const percent = $derived(linearScale([0, view.max], [0, 100]));

  function sentence(row: LineupRow): string {
    return `${teamLabel(row.team)} scored ${formatPoints(row.scored)} of a possible ${formatPoints(row.best)} points, ${formatPercent(row.efficiency)}, missing ${formatPoints(row.missed)} points`;
  }
</script>

<ChartRows
  label="Lineup points for each team, best manager first"
  rows={view.rows}
  key={(row) => row.team.team_id}
  name={(row) => row.team.name}
  champion={(row) => isChampion(row.team)}
  describe={sentence}
  rowHeight="2.4rem"
>
  {#snippet track(row)}
    <span class="scored" style:width="{percent(row.scored)}%"></span>
    <span class="missed" style:width="{percent(row.missed)}%"></span>
  {/snippet}
  {#snippet value(row)}
    <strong>{formatPercent(row.efficiency)}</strong>
    <span class="cost">{formatPoints(row.missed)} missed</span>
  {/snippet}
</ChartRows>

<Legend
  items={[
    { label: 'Points scored', kind: 'series' },
    { label: 'Points missed (the bar ends at your best possible lineups)', kind: 'hatch' },
  ]}
/>

<style>
  .scored,
  .missed {
    display: block;
    height: 1.05rem;
    transform-origin: left;
    animation: grow var(--dur-slow) var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 45ms);
  }

  .scored {
    background: var(--muted);
    border-radius: 3px 0 0 3px;
  }

  .missed {
    background: var(--hatch);
    box-shadow: inset 0 0 0 1.5px var(--muted);
    border-radius: 0 3px 3px 0;
  }

  .cost {
    margin-left: 0.6rem;
    color: var(--muted);
    font-size: 0.82rem;
  }
</style>
