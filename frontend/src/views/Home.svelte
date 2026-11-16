<script lang="ts">
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import { BRAND_NAME } from '@/lib/brand';
  import { link } from '@/lib/link';
  import { seasonPath } from '@/lib/router.svelte';
  import { useServices } from '@/lib/services';

  const { leagues: leaguesCache, router } = useServices();
  const leagues = leaguesCache.get();
</script>

<section>
  <h1>Who's for real?</h1>
  {#await leagues}
    <p class="status" role="status">Loading your leagues…</p>
  {:then items}
    {#if items.length === 0}
      <p class="status">No leagues yet. Ask whoever runs {BRAND_NAME} to add you.</p>
    {:else}
      <ul>
        {#each items as league (league.league_id)}
          {@const latest = league.years.at(-1)}
          <li>
            <h2>{league.name}</h2>
            {#if latest !== undefined}
              <a href={seasonPath(league.league_id, latest)} use:link={router}>
                {latest} season
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {:catch error}
    <ErrorPanel {error} />
  {/await}
</section>

<style>
  ul {
    list-style: none;
    margin: 1.5rem 0 0;
    padding: 0;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  }

  li {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
  }

  h2 {
    font-size: 1.15rem;
  }

  li a {
    color: var(--accent);
    font-weight: 600;
  }

  .status {
    color: var(--muted);
  }
</style>
