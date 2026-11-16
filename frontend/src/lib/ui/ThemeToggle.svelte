<script lang="ts">
  import { useServices } from '@/lib/services';

  const { theme } = useServices();

  const NAMES = { system: 'Match system', dark: 'Dark', light: 'Light' } as const;
</script>

<button
  type="button"
  onclick={() => theme.cycle()}
  aria-label={`Theme: ${NAMES[theme.choice]}. Change theme.`}
  title={`Theme: ${NAMES[theme.choice]}`}
>
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {#if theme.choice === 'dark'}
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    {:else if theme.choice === 'light'}
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    {:else}
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16" />
      <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
    {/if}
  </svg>
</button>

<style>
  button {
    flex: none;
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    transition:
      color var(--dur-fast) var(--ease-out),
      background var(--dur-fast) var(--ease-out);
  }

  button:hover {
    color: var(--text);
    background: var(--surface-raised);
  }
</style>
