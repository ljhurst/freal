<script lang="ts">
  let {
    label,
    controls,
    open = $bindable(false),
  }: { label: string; controls: string; open?: boolean } = $props();
</script>

<button
  type="button"
  aria-label={label}
  aria-expanded={open}
  aria-controls={controls}
  onclick={() => (open = !open)}
>
  i
</button>

<style>
  button {
    flex: none;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: 1.5px solid var(--muted);
    border-radius: 50%;
    background: transparent;
    color: var(--muted);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 0.85rem;
    font-style: italic;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    transition:
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out),
      background var(--dur-fast) var(--ease-out);
  }

  button:hover,
  button[aria-expanded='true'] {
    border-color: var(--accent);
    color: var(--text);
  }

  button[aria-expanded='true'] {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
</style>
