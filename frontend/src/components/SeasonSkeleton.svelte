<script lang="ts">
  import type { SeasonTab } from '@/lib/router.svelte';
  import Card from '@/lib/ui/Card.svelte';
  import Skeleton from '@/lib/ui/Skeleton.svelte';

  let { tab, year }: { tab: SeasonTab; year: number } = $props();
</script>

<div class="loading" role="status">
  <span class="visually-hidden">Loading the {year} season…</span>

  {#if tab === 'overview'}
    <div class="hero">
      <Skeleton width="7rem" height="0.8rem" />
      <Skeleton width="min(18rem, 70%)" height="1.5rem" />
      <Skeleton width="min(15rem, 60%)" height="1.5rem" />
    </div>
    <div class="tiles">
      {#each [1, 2, 3, 4, 5] as tile (tile)}
        <Skeleton height="6.5rem" />
      {/each}
    </div>
    <Card>
      <Skeleton width="8rem" height="1.2rem" />
      <div class="rows">
        {#each [1, 2, 3, 4, 5, 6] as row (row)}
          <Skeleton height="2.2rem" />
        {/each}
      </div>
    </Card>
  {:else if tab === 'luck'}
    <Card>
      <Skeleton width="11rem" height="1.2rem" />
      <div class="chart"><Skeleton height="20rem" /></div>
    </Card>
    <Card>
      <Skeleton width="10rem" height="1.2rem" />
      <div class="chart"><Skeleton height="12rem" /></div>
    </Card>
  {:else}
    <Card>
      <Skeleton width="10rem" height="1.2rem" />
      <div class="chart"><Skeleton height="16rem" /></div>
    </Card>
  {/if}
</div>

<style>
  .loading {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }

  .hero {
    display: grid;
    gap: 0.6rem;
    padding-bottom: 0.5rem;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.75rem;
  }

  .rows {
    display: grid;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .chart {
    margin-top: 1rem;
  }
</style>
