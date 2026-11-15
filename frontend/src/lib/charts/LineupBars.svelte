<script lang="ts">
  import Legend from '@/lib/charts/Legend.svelte';
  import { linearScale } from '@/lib/charts/scales';
  import { formatPercent, formatPoints } from '@/lib/format';
  import type { LineupView } from '@/lib/season/lineups';

  let { view }: { view: LineupView } = $props();

  const percent = $derived(linearScale([0, view.max], [0, 100]));

  function sentence(row: LineupView['rows'][number]): string {
    return `${row.team.name} scored ${formatPoints(row.scored)} of a possible ${formatPoints(row.best)} points, ${formatPercent(row.efficiency)}, missing ${formatPoints(row.missed)} points`;
  }
</script>

<div class="scroll">
  <ol class="bars" aria-label="Lineup points for each team, best manager first">
    {#each view.rows as row, index (row.team.team_id)}
      <li class="row" style:--i={index}>
        <span class="name">{row.team.name}</span>
        <span class="track" role="img" aria-label={sentence(row)}>
          <span class="scored" style:width="{percent(row.scored)}%"></span>
          <span class="missed" style:width="{percent(row.missed)}%"></span>
        </span>
        <span class="value" aria-hidden="true">
          <strong>{formatPercent(row.efficiency)}</strong>
          <span class="cost">{formatPoints(row.missed)} missed</span>
        </span>
      </li>
    {/each}
  </ol>
</div>

<Legend
  items={[
    { label: 'Points scored', kind: 'series' },
    { label: 'Points missed (the bar ends at your best possible lineups)', kind: 'hatch' },
  ]}
/>

<style>
  .scroll {
    overflow-x: auto;
  }

  .bars {
    display: grid;
    grid-template-columns: max-content minmax(9rem, 1fr) max-content;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
    min-width: 22rem;
  }

  .row {
    display: contents;
  }

  .name,
  .track,
  .value {
    display: flex;
    align-items: center;
    height: 2.4rem;
    border-bottom: 1px solid var(--border);
  }

  .row:last-child > * {
    border-bottom: 0;
  }

  .name {
    padding-right: 1rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .track {
    gap: 0;
  }

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

  .value {
    justify-content: flex-end;
    gap: 0.6rem;
    padding-left: 1rem;
    white-space: nowrap;
  }

  .cost {
    color: var(--muted);
    font-size: 0.82rem;
  }

  @media (max-width: 52rem) {
    .bars {
      display: block;
      min-width: 0;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'name value'
        'track track';
      column-gap: 0.75rem;
      align-items: baseline;
      padding: 0.6rem 0 0.2rem;
      border-bottom: 1px solid var(--border);
    }

    .row:last-child {
      border-bottom: 0;
    }

    .name,
    .value,
    .track {
      height: auto;
      padding: 0;
      border-bottom: 0;
    }

    .name {
      grid-area: name;
      white-space: normal;
    }

    .value {
      grid-area: value;
    }

    .track {
      grid-area: track;
      height: 1.75rem;
    }
  }
</style>
