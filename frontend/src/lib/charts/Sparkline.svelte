<script lang="ts">
  let { points, min, max }: { points: readonly number[]; min: number; max: number } = $props();

  const WIDTH = 96;
  const HEIGHT = 24;
  const PAD = 2.5;

  const coords = $derived(
    points.map((value, index) => {
      const x =
        points.length === 1 ? WIDTH / 2 : PAD + (index / (points.length - 1)) * (WIDTH - 2 * PAD);
      const y =
        max === min ? HEIGHT / 2 : PAD + (1 - (value - min) / (max - min)) * (HEIGHT - 2 * PAD);
      return [x, y] as const;
    }),
  );
  const line = $derived(coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
  const last = $derived(coords.at(-1));
  const label = $derived(
    `Weekly points over ${points.length} ${points.length === 1 ? 'game' : 'games'}, latest ${(points.at(-1) ?? 0).toFixed(1)}`,
  );
</script>

{#if points.length > 0}
  <svg viewBox="0 0 {WIDTH} {HEIGHT}" width={WIDTH} height={HEIGHT} role="img" aria-label={label}>
    <polyline points={line} fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
    {#if last}
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--text)" stroke="var(--surface)" stroke-width="1.5" />
    {/if}
  </svg>
{/if}
