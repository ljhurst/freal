<script lang="ts">
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import { BRAND_NAME } from '@/lib/brand';
  import { seasonPath } from '@/lib/router.svelte';
  import { useServices } from '@/lib/services';
  import StatTile from '@/lib/ui/StatTile.svelte';

  const { leagues: leaguesCache, router } = useServices();
  const leagues = leaguesCache.get();
</script>

<section>
  <h1>Your leagues</h1>
  {#await leagues}
    <p class="status" role="status">Loading your leagues…</p>
  {:then items}
    {#if items.length === 0}
      <p class="status">No leagues yet. Ask whoever runs {BRAND_NAME} to add you.</p>
    {:else}
      <div class="leagues">
        {#each items as league, index (league.league_id)}
          {@const latest = league.years.at(-1)}
          {#if latest !== undefined}
            <StatTile
              label={`Since ${league.years[0]}`}
              name={league.name}
              figure={`${latest} season`}
              href={seasonPath(league.league_id, latest)}
              {router}
              index={index + 1}
            />
          {/if}
        {/each}
      </div>
    {/if}
  {:catch error}
    <ErrorPanel {error} />
  {/await}
</section>

<style>
  .leagues {
    margin-top: 1.5rem;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  }

  .status {
    color: var(--muted);
  }
</style>
