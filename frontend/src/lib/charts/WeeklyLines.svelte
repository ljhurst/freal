<script lang="ts">
  import Legend from '@/lib/charts/Legend.svelte';
  import { pointerReach } from '@/lib/charts/pointer';
  import { integerTicks, linearScale, niceTicks } from '@/lib/charts/scales';
  import Tooltip from '@/lib/charts/Tooltip.svelte';
  import { formatPoints } from '@/lib/format';
  import type { TeamGames, WeeklyView } from '@/lib/season/weekly';

  let { view, selectedId }: { view: WeeklyView; selectedId: number } = $props();

  const MARGIN = { top: 16, right: 20, bottom: 40, left: 48 };
  const RESULT_WORDS = { win: 'Won', loss: 'Lost', tie: 'Tied' } as const;

  let width = $state(640);
  let active = $state<number | null>(null);
  let svg = $state<SVGSVGElement>();

  const height = $derived(Math.round(Math.min(Math.max(width * 0.55, 260), 380)));
  const firstWeek = $derived(view.weeks[0] ?? 1);
  const lastWeek = $derived(view.weeks.at(-1) ?? 1);
  const allPoints = $derived(view.teams.flatMap((entry) => entry.games.map((game) => game.points)));
  const domain = $derived<[number, number]>([
    Math.floor((Math.min(...allPoints) - 5) / 10) * 10,
    Math.ceil((Math.max(...allPoints) + 5) / 10) * 10,
  ]);
  const xScale = $derived(linearScale([firstWeek, lastWeek], [MARGIN.left, width - MARGIN.right]));
  const yScale = $derived(linearScale(domain, [height - MARGIN.bottom, MARGIN.top]));
  const yTicks = $derived(niceTicks(domain, 6));
  const xTicks = $derived(integerTicks([firstWeek, lastWeek], width < 480 ? 7 : 14));

  const selected = $derived(view.teams.find((entry) => entry.team.team_id === selectedId));
  const others = $derived(view.teams.filter((entry) => entry.team.team_id !== selectedId));
  const medianLine = $derived(
    path(view.weeks.map((week) => [xScale(week), yScale(view.medians.get(week) ?? 0)])),
  );
  const shownWeek = $derived(active === null ? null : (view.weeks[active] ?? null));
  const shownGame = $derived(selected?.games.find((game) => game.week === shownWeek));

  const pointer = pointerReach({
    target: () => svg,
    find: (x) => {
      if (x < MARGIN.left - 12 || x > width - MARGIN.right + 12) return null;
      let best: number | null = null;
      let distance = Number.POSITIVE_INFINITY;
      view.weeks.forEach((week, index) => {
        const gap = Math.abs(xScale(week) - x);
        if (gap < distance) {
          distance = gap;
          best = index;
        }
      });
      return best;
    },
    set: (index) => {
      active = index;
    },
  });

  function path(points: readonly (readonly [number, number])[]): string {
    return points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
      .join('');
  }

  function linePath(entry: TeamGames): string {
    return path(entry.games.map((game) => [xScale(game.week), yScale(game.points)]));
  }
</script>

<svelte:window onpointerdown={pointer.dismiss} />

<div class="chart" bind:clientWidth={width}>
  <svg
    bind:this={svg}
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    role="group"
    aria-label="Points scored each week by {view.teams.length} teams over {view.weeks.length} weeks, with {selected?.team.name ?? 'one team'} highlighted"
    onpointermove={pointer.move}
    onpointerdown={pointer.move}
    onpointerleave={pointer.leave}
  >
    {#each yTicks as tick (tick)}
      <line class="grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={yScale(tick)} y2={yScale(tick)} />
      <text class="tick" x={MARGIN.left - 10} y={yScale(tick)} text-anchor="end" dominant-baseline="middle">{tick}</text>
    {/each}
    {#each xTicks as tick (tick)}
      <text class="tick" x={xScale(tick)} y={height - MARGIN.bottom + 18} text-anchor="middle">{tick}</text>
    {/each}
    <text class="axis-title" x={(MARGIN.left + width - MARGIN.right) / 2} y={height - 6} text-anchor="middle">Week</text>
    <text
      class="axis-title"
      transform="translate(14 {(MARGIN.top + height - MARGIN.bottom) / 2}) rotate(-90)"
      text-anchor="middle"
    >
      Points
    </text>

    {#each others as entry, index (entry.team.team_id)}
      <path class="other draw" d={linePath(entry)} pathLength="1" style:--i={index} />
    {/each}
    <path class="median" d={medianLine} />

    {#if selected}
      <path class="chosen draw" d={linePath(selected)} pathLength="1" />
    {/if}

    {#if shownWeek !== null}
      <line class="cross" x1={xScale(shownWeek)} x2={xScale(shownWeek)} y1={MARGIN.top} y2={height - MARGIN.bottom} />
    {/if}

    {#if selected}
      {#each selected.games as game (game.week)}
        <circle
          class="result {game.result}"
          cx={xScale(game.week)}
          cy={yScale(game.points)}
          r="5"
        />
      {/each}
      {@const last = selected.games.at(-1)}
      {#if last}
        <text class="label" x={xScale(last.week)} y={Math.max(MARGIN.top + 10, yScale(last.points) - 12)} text-anchor="end">
          {selected.team.name}
        </text>
      {/if}
    {/if}
  </svg>

  {#if selected && shownGame && shownWeek !== null}
    <Tooltip x={xScale(shownWeek)} y={yScale(shownGame.points)} {width}>
      <strong>Week {shownWeek}</strong>
      <span>{selected.team.name} {formatPoints(shownGame.points)}</span>
      <span>
        {RESULT_WORDS[shownGame.result]} against {shownGame.opponent?.name ?? 'an opponent'}
        {formatPoints(shownGame.opponentPoints)}
      </span>
      <span>League median {formatPoints(view.medians.get(shownWeek) ?? 0)}</span>
    </Tooltip>
  {/if}
</div>

<Legend
  items={[
    { label: 'Selected team', kind: 'selected' },
    { label: 'Other teams', kind: 'others' },
    { label: 'League median', kind: 'median' },
    { label: 'Win', kind: 'win' },
    { label: 'Loss', kind: 'loss' },
  ]}
/>

<style>
  .chart {
    position: relative;
    width: 100%;
  }

  svg {
    display: block;
    max-width: 100%;
    touch-action: pan-y;
  }

  .grid {
    stroke: var(--grid);
  }

  .tick,
  .axis-title {
    fill: var(--muted);
    font-size: 11px;
  }

  .axis-title {
    font-size: 12px;
    font-weight: 600;
  }

  path {
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .draw {
    stroke-dasharray: 1;
    animation: draw 900ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 60ms);
  }

  .other {
    stroke: var(--muted);
    stroke-width: 1.5;
    opacity: 0.4;
  }

  .median {
    stroke: var(--text-2);
    stroke-width: 1.5;
    stroke-dasharray: 5 5;
  }

  .chosen {
    stroke: var(--accent);
    stroke-width: 3;
  }

  .cross {
    stroke: var(--axis);
  }

  .result {
    stroke: var(--accent);
    stroke-width: 2.5;
  }

  .win {
    fill: var(--accent);
  }

  .loss {
    fill: var(--surface);
  }

  .tie {
    fill: var(--muted);
  }

  .label {
    fill: var(--text);
    font-size: 12px;
    font-weight: 650;
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 3px;
    stroke-linejoin: round;
    pointer-events: none;
  }
</style>
