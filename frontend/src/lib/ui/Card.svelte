<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    index = 0,
    actions,
    children,
  }: {
    title?: string;
    index?: number;
    actions?: Snippet;
    children: Snippet;
  } = $props();
</script>

<section class="card rise" style:--i={index}>
  {#if title || actions}
    <header>
      {#if title}<h2>{title}</h2>{/if}
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </header>
  {/if}
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


  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  h2 {
    font-size: 1.15rem;
    margin: 0;
  }
</style>
