<script lang="ts">
  import type { LeagueSummary } from '@/lib/api/client';
  import { link } from '@/lib/link';
  import { seasonPath } from '@/lib/router.svelte';
  import { useServices } from '@/lib/services';

  let { leagues, leagueId }: { leagues: LeagueSummary[]; leagueId: number } = $props();

  const { router } = useServices();
  const listId = $props.id();

  let open = $state(false);
  let root = $state<HTMLDivElement>();
  let button = $state<HTMLButtonElement>();

  const current = $derived(leagues.find((league) => league.league_id === leagueId));

  function closeOnOutsideClick(event: MouseEvent): void {
    if (open && root && !root.contains(event.target as Node)) {
      open = false;
    }
  }

  function closeWhenFocusLeaves(event: FocusEvent): void {
    if (open && !root?.contains(event.relatedTarget as Node | null)) {
      open = false;
    }
  }

  function closeOnEscape(event: KeyboardEvent): void {
    if (open && event.key === 'Escape') {
      open = false;
      button?.focus();
    }
  }
</script>

<svelte:window onclick={closeOnOutsideClick} onkeydown={closeOnEscape} />

<div class="menu" bind:this={root} onfocusout={closeWhenFocusLeaves}>
  <button
    type="button"
    bind:this={button}
    aria-expanded={open}
    aria-controls={listId}
    onclick={() => (open = !open)}
  >
    <span class="name">{current?.name}</span>
    <svg viewBox="0 0 12 12" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 4l4 4 4-4" />
    </svg>
  </button>
  {#if open}
    <ul id={listId}>
      {#each leagues as league (league.league_id)}
        {@const latest = league.years.at(-1)}
        {#if latest !== undefined}
          <li>
            <a
              href={seasonPath(league.league_id, latest)}
              use:link={router}
              aria-current={league.league_id === leagueId ? 'true' : undefined}
              onclick={() => (open = false)}
            >
              <span class="label">{league.name}</span>
              {#if league.league_id === leagueId}<span class="check" aria-hidden="true">✓</span>{/if}
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</div>

<style>
  .menu {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: clamp(1.9rem, 6vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
    text-align: left;
    cursor: pointer;
  }

  .name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  svg {
    flex: none;
    width: 0.55em;
    height: 0.55em;
    color: var(--muted);
    transition:
      color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }

  button:hover svg {
    color: var(--accent);
  }

  button[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }

  ul {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 5;
    min-width: 100%;
    width: max-content;
    max-width: min(24rem, calc(100vw - 2 * var(--gutter)));
    margin: 0.5rem 0 0;
    padding: 0.35rem;
    list-style: none;
    background: var(--surface-raised);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }

  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0.7rem;
    border-radius: var(--radius-sm);
    color: var(--text);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    background: var(--surface);
  }

  a[aria-current] {
    color: var(--accent);
  }

  .label {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .check {
    flex: none;
  }
</style>
