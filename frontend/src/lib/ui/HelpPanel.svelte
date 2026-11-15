<script lang="ts">
  import type { Snippet } from 'svelte';

  let { id, open, children }: { id: string; open: boolean; children: Snippet } = $props();
</script>

<div {id} class="panel" role="note" hidden={!open}>
  {@render children()}
</div>

<style>
  .panel {
    max-width: 44rem;
    margin: 0 0 1rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface-raised);
    color: var(--text-2);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .panel[hidden] {
    display: none;
  }

  .panel :global(p) {
    margin: 0;
  }

  .panel :global(p + p) {
    margin-top: 0.5rem;
  }
</style>
