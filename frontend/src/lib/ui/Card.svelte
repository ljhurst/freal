<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    eyebrow,
    index = 0,
    children,
  }: { title?: string; eyebrow?: string; index?: number; children: Snippet } = $props();
</script>

<section class="card rise" style:--i={index}>
  {#if eyebrow}<p class="eyebrow">{eyebrow}</p>{/if}
  {#if title}<h2>{title}</h2>{/if}
  {@render children()}
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.25rem 1.25rem 1rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
  }

  h2 {
    font-size: 1.15rem;
    margin-bottom: 0.75rem;
  }
</style>
