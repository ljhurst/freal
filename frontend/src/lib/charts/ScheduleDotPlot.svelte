<script lang="ts">
  import Legend from '@/lib/charts/Legend.svelte';
  import { linearScale } from '@/lib/charts/scales';
  import { formatPoints, formatSigned } from '@/lib/format';
  import type { ScheduleView } from '@/lib/season/luckMap';

  let { view }: { view: ScheduleView } = $props();

  const values = $derived(view.rows.map((row) => row.opponentPoints));
  const low = $derived(Math.floor(Math.min(...values) - 1));
  const high = $derived(Math.ceil(Math.max(...values) + 1));
  const percent = $derived(linearScale([low, high], [0, 100]));

  function tone(edge: number): 'helped' | 'hurt' | 'even' {
    return edge > 0 ? 'helped' : edge < 0 ? 'hurt' : 'even';
  }

  function sentence(row: ScheduleView['rows'][number]): string {
    const gap = Math.abs(row.edge).toFixed(1);
    const how =
      row.edge > 0
        ? `${gap} points easier than average`
        : row.edge < 0
          ? `${gap} points tougher than average`
          : 'an average schedule';
    return `${row.team.name} faced ${row.opponentPoints.toFixed(1)} points per game, ${how}`;
  }
</script>

<div class="scroll">
  <ol class="plot" aria-label="Average points scored against each team, easiest schedule first">
    <li class="axis" aria-hidden="true">
      <span></span>
      <span class="scale">
        <span class="end">{low}</span>
        <span class="average" style:left="{percent(view.leagueAverage)}%">
          League average {formatPoints(view.leagueAverage)}
        </span>
        <span class="end right">{high}</span>
      </span>
      <span></span>
    </li>
    {#each view.rows as row, index (row.team.team_id)}
      <li class="row" style:--i={index}>
        <span class="name">{row.team.name}</span>
        <span class="track" role="img" aria-label={sentence(row)}>
          <span class="average-line" style:left="{percent(view.leagueAverage)}%"></span>
          <span
            class="dot {tone(row.edge)}"
            style:left="{percent(row.opponentPoints)}%"
          ></span>
        </span>
        <span class="value" aria-hidden="true">
          {formatPoints(row.opponentPoints)}
          <span class="edge">{formatSigned(row.edge)}</span>
        </span>
      </li>
    {/each}
  </ol>
</div>

<Legend
  items={[
    { label: 'Easier than average: the schedule helped', kind: 'lucky' },
    { label: 'Tougher than average: it hurt', kind: 'unlucky' },
  ]}
/>

<style>
  .scroll {
    overflow-x: auto;
  }

  .plot {
    display: grid;
    grid-template-columns: max-content minmax(9rem, 1fr) max-content;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
    min-width: 22rem;
  }

  .row,
  .axis {
    display: contents;
  }

  .name {
    padding-right: 1rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .track {
    position: relative;
    height: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .name,
  .value {
    display: flex;
    align-items: center;
    height: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .row:last-child > * {
    border-bottom: 0;
  }

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

  .value {
    justify-content: flex-end;
    padding-left: 1rem;
    white-space: nowrap;
  }

  .edge {
    margin-left: 0.5rem;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .scale {
    position: relative;
    display: block;
    height: 1.6rem;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .end {
    position: absolute;
    left: 0;
    bottom: 0.2rem;
  }

  .right {
    left: auto;
    right: 0;
  }

  .average {
    position: absolute;
    bottom: 0.2rem;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  @media (max-width: 36rem) {
    .plot {
      display: block;
      min-width: 0;
    }

    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) max-content;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding: 0.5rem 0 0.25rem;
    }

    .row > * {
      border-bottom: 0;
    }

    .row:last-child {
      border-bottom: 0;
    }

    .name {
      grid-column: 1 / -1;
      height: auto;
      padding: 0 0 0.2rem;
      white-space: normal;
    }

    .value {
      height: 2rem;
      padding-left: 0.75rem;
    }

    .axis {
      display: block;
    }
  }
</style>
