<script lang="ts">
  import type { TeamReport } from '@/lib/api/client';

  let {
    teams,
    selected,
    onselect,
  }: { teams: readonly TeamReport[]; selected: number; onselect: (teamId: number) => void } =
    $props();

  let row = $state<HTMLDivElement>();

  $effect(() => {
    void selected;
    const chosen = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && chosen) {
      row.scrollTo?.({ left: chosen.offsetLeft - 16, behavior: 'smooth' });
    }
  });
</script>

<div class="chips" role="group" aria-label="Team to highlight" bind:this={row}>
  {#each teams as team (team.team_id)}
    <button
      type="button"
      aria-pressed={team.team_id === selected}
      onclick={() => onselect(team.team_id)}
    >
      {team.name}
    </button>
  {/each}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 36rem) {
    .chips {
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      margin-right: -1.25rem;
      padding-right: 1.25rem;
    }

    button {
      flex: none;
    }
  }

  button {
    padding: 0.3rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-raised);
    color: var(--text-2);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }

  button:hover {
    color: var(--text);
  }

  button[aria-pressed='true'] {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--surface-raised));
    color: var(--text);
  }
</style>
