<script lang="ts">
  import AccessLeague from '@/components/AccessLeague.svelte';
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import type { LeagueAccess } from '@/lib/api/client';
  import { useServices } from '@/lib/services';

  const { api, session } = useServices();

  const allowed = session?.isAdmin === true;
  const loaded = allowed ? api.access() : Promise.resolve<LeagueAccess[]>([]);
</script>

<section>
  <h1>Access</h1>
  {#if !allowed}
    <p class="status">Only admins can change who sees a league.</p>
  {:else}
    {#await loaded}
      <p class="status" role="status">Loading…</p>
    {:then leagues}
      {#each leagues as league (league.league_id)}
        <AccessLeague {league} />
      {/each}
    {:catch error}
      <ErrorPanel {error} />
    {/await}
  {/if}
</section>

<style>
  .status {
    color: var(--muted);
  }
</style>
