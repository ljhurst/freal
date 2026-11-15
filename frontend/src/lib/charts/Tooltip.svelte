<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Position of the thing pointed at, relative to the chart's own box. */
  let { x, y, width, children }: { x: number; y: number; width: number; children: Snippet } =
    $props();

  const flip = $derived(x > width * 0.55);
</script>

<div
  class="tooltip"
  class:flip
  style:left="{x}px"
  style:top="{y}px"
  aria-hidden="true"
>
  {@render children()}
</div>

<style>
  .tooltip {
    position: absolute;
    z-index: 2;
    min-width: 9rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid var(--axis);
    border-radius: var(--radius-sm);
    background: var(--surface-raised);
    box-shadow: var(--shadow);
    font-size: 0.82rem;
    line-height: 1.35;
    pointer-events: none;
    transform: translate(0.9rem, -50%);
  }

  .flip {
    transform: translate(calc(-100% - 0.9rem), -50%);
  }

  .tooltip :global(strong) {
    display: block;
    margin-bottom: 0.15rem;
  }

  .tooltip :global(span) {
    display: block;
    color: var(--text-2);
  }
</style>
