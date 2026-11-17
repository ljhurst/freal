<script lang="ts">
  import { TROPHY_MARK_SIZE, TROPHY_PATHS } from '@/lib/ui/trophy';

  let { x, y, size = TROPHY_MARK_SIZE }: { x: number; y: number; size?: number } = $props();
</script>

<svg
  class="mark"
  {x}
  {y}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  role="img"
  aria-label="Champion"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  {#each TROPHY_PATHS as path (path.d)}
    <path d={path.d} fill={path.filled ? 'currentColor' : 'none'} fill-opacity={path.filled ? 0.25 : 1} />
  {/each}
</svg>

<style>
  .mark {
    color: var(--trophy);
  }
</style>
