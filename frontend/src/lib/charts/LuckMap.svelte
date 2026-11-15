<script lang="ts">
  import Legend from '@/lib/charts/Legend.svelte';
  import { placeLabels } from '@/lib/charts/labels';
  import { integerTicks, linearScale, nearestPoint } from '@/lib/charts/scales';
  import Tooltip from '@/lib/charts/Tooltip.svelte';
  import { formatRecord, formatSigned } from '@/lib/format';
  import { type LuckDot, sharedDomain } from '@/lib/season/luckMap';

  let { dots }: { dots: readonly LuckDot[] } = $props();

  const MARGIN = { top: 14, right: 18, bottom: 48, left: 48 };
  const DOT_RADIUS = 7;
  const RING_RADIUS = 11;
  const FONT_SIZE = 12;
  const HOVER_REACH = 40;

  let width = $state(640);
  let active = $state<number | null>(null);
  let svg = $state<SVGSVGElement>();

  const height = $derived(
    Math.round(Math.min(Math.max(width * (width < 520 ? 1 : 0.72), 300), 460)),
  );
  const domain = $derived(sharedDomain(dots));
  const xScale = $derived(linearScale(domain, [MARGIN.left, width - MARGIN.right]));
  const yScale = $derived(linearScale(domain, [height - MARGIN.bottom, MARGIN.top]));
  const ticks = $derived(integerTicks(domain, width < 480 ? 7 : 16));
  const points = $derived(
    dots.map((dot) => ({ dot, cx: xScale(dot.expected), cy: yScale(dot.actual) })),
  );
  const labels = $derived(
    placeLabels(
      [...points]
        .sort(
          (a, b) =>
            Number(b.dot.team.for_real) - Number(a.dot.team.for_real) ||
            Math.abs(b.dot.team.luck.luck) - Math.abs(a.dot.team.luck.luck),
        )
        .map((point) => ({
          id: String(point.dot.team.team_id),
          text: point.dot.team.name,
          x: point.cx,
          y: point.cy,
        })),
      {
        dotRadius: RING_RADIUS,
        fontSize: FONT_SIZE,
        gap: 4,
        bounds: {
          left: MARGIN.left,
          top: MARGIN.top,
          right: width - MARGIN.right,
          bottom: height - MARGIN.bottom,
        },
      },
    ),
  );
  const shown = $derived(active === null ? null : (points[active] ?? null));

  function summary(dot: LuckDot): string {
    const { team } = dot;
    const mood =
      dot.polarity === 'lucky'
        ? `lucky by ${Math.abs(team.luck.luck).toFixed(1)} wins`
        : dot.polarity === 'unlucky'
          ? `unlucky by ${Math.abs(team.luck.luck).toFixed(1)} wins`
          : 'record matches expected';
    const stamp = team.for_real ? ', for real' : '';
    return `${team.name}: expected ${dot.expected.toFixed(1)} wins, record ${formatRecord(team.standing.wins, team.standing.losses, team.standing.ties)}, ${mood}${stamp}`;
  }

  function reach(event: PointerEvent): void {
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    active = nearestPoint(points, event.clientX - box.left, event.clientY - box.top, HOVER_REACH);
  }

  function leave(event: PointerEvent): void {
    if (event.pointerType !== 'touch') active = null;
  }

  function dismiss(event: PointerEvent): void {
    if (!svg?.contains(event.target as Node)) active = null;
  }
</script>

<svelte:window onpointerdown={dismiss} />

<div class="map" bind:clientWidth={width}>
  <svg
    bind:this={svg}
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    role="group"
    aria-label="Expected wins against actual wins for {dots.length} teams. A dot above the dashed line is lucky; below it is unlucky."
    onpointermove={reach}
    onpointerdown={reach}
    onpointerleave={leave}
  >
    {#each ticks as tick (tick)}
      <line class="grid" x1={xScale(tick)} x2={xScale(tick)} y1={MARGIN.top} y2={height - MARGIN.bottom} />
      <line class="grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={yScale(tick)} y2={yScale(tick)} />
      <text class="tick" x={xScale(tick)} y={height - MARGIN.bottom + 18} text-anchor="middle">{tick}</text>
      <text class="tick" x={MARGIN.left - 10} y={yScale(tick)} text-anchor="end" dominant-baseline="middle">{tick}</text>
    {/each}

    <line
      class="diagonal"
      x1={xScale(domain[0])}
      y1={yScale(domain[0])}
      x2={xScale(domain[1])}
      y2={yScale(domain[1])}
    />

    <text class="region" x={MARGIN.left + 8} y={MARGIN.top + 14}>▲ Lucky</text>
    <text class="region" x={width - MARGIN.right - 8} y={height - MARGIN.bottom - 8} text-anchor="end">▼ Unlucky</text>

    <text class="axis-title" x={(MARGIN.left + width - MARGIN.right) / 2} y={height - 8} text-anchor="middle">
      Expected wins
    </text>
    <text
      class="axis-title"
      transform="translate(14 {(MARGIN.top + height - MARGIN.bottom) / 2}) rotate(-90)"
      text-anchor="middle"
    >
      Actual wins
    </text>

    {#each points as point, index (point.dot.team.team_id)}
      <g class="dot" style:--i={index} role="img" aria-label={summary(point.dot)}>
        {#if point.dot.team.for_real}
          <circle class="ring" cx={point.cx} cy={point.cy} r={RING_RADIUS} />
        {/if}
        <circle class="mark {point.dot.polarity}" cx={point.cx} cy={point.cy} r={DOT_RADIUS} />
      </g>
    {/each}

    {#each points as point (point.dot.team.team_id)}
      {@const label = labels.get(String(point.dot.team.team_id))}
      {#if label}
        <text class="label" x={label.x} y={label.y} text-anchor={label.anchor} dominant-baseline="middle">
          {point.dot.team.name}
        </text>
      {/if}
    {/each}
  </svg>

  {#if shown}
    <Tooltip x={shown.cx} y={shown.cy} {width}>
      <strong>{shown.dot.team.name}</strong>
      <span>Record {formatRecord(shown.dot.team.standing.wins, shown.dot.team.standing.losses, shown.dot.team.standing.ties)}</span>
      <span>Expected {shown.dot.expected.toFixed(1)} wins</span>
      <span>Luck {formatSigned(shown.dot.team.luck.luck)} wins</span>
    </Tooltip>
  {/if}
</div>

<Legend
  items={[
    { label: 'Lucky', kind: 'lucky' },
    { label: 'Unlucky', kind: 'unlucky' },
    { label: 'About as expected', kind: 'neutral' },
    { label: 'For real', kind: 'stamp' },
    { label: 'Actual matches expected', kind: 'dash' },
  ]}
/>

<style>
  .map {
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

  .diagonal {
    stroke: var(--axis);
    stroke-width: 1.5;
    stroke-dasharray: 5 5;
  }

  .tick,
  .axis-title,
  .region {
    fill: var(--muted);
    font-size: 11px;
  }

  .axis-title {
    font-size: 12px;
    font-weight: 600;
  }

  .region {
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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

  .dot {
    transform-box: fill-box;
    transform-origin: center;
    animation: pop var(--dur-slow) var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 45ms);
  }

  .mark {
    stroke: var(--surface);
    stroke-width: 2px;
  }

  .ring {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2px;
  }

  .lucky {
    fill: var(--lucky);
  }

  .unlucky {
    fill: var(--unlucky);
  }

  .even {
    fill: var(--neutral);
  }

</style>
