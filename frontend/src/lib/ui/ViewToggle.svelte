<script module lang="ts">
  export type View = 'chart' | 'table';
</script>

<script lang="ts">
  let { view = $bindable('chart') }: { view?: View } = $props();

  const OPTIONS: readonly { id: View; label: string }[] = [
    { id: 'chart', label: 'Chart' },
    { id: 'table', label: 'Table' },
  ];
</script>

<div class="toggle" role="group" aria-label="Show as">
  {#each OPTIONS as option (option.id)}
    <button type="button" aria-pressed={view === option.id} onclick={() => (view = option.id)}>
      {option.label}
    </button>
  {/each}
</div>

<style>
  .toggle {
    display: inline-flex;
    padding: 0.15rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg);
  }

  button {
    min-height: 1.75rem;
    padding: 0 0.8rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 650;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }

  button[aria-pressed='true'] {
    background: var(--surface-raised);
    color: var(--text);
  }
</style>
