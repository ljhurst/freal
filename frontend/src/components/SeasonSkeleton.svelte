<script lang="ts">
  import type { SeasonTab } from '@/lib/router.svelte';
  import Card from '@/lib/ui/Card.svelte';
  import Skeleton from '@/lib/ui/Skeleton.svelte';

  let { tab, year }: { tab: SeasonTab; year: number } = $props();
</script>

<div class="loading" role="status">
  <span class="visually-hidden">Loading the {year} season…</span>

  {#if tab === 'overview'}
    <Card>
      <Skeleton width="9rem" height="1.2rem" />
      <div class="rows">
        <Skeleton width="min(18rem, 70%)" height="1.5rem" />
        <Skeleton width="min(15rem, 60%)" height="1.5rem" />
      </div>
    </Card>
    <div>
      <Skeleton width="9rem" height="1.2rem" />
      <div class="tiles">
        {#each [1, 2, 3, 4, 5] as tile (tile)}
          <Skeleton height="6.5rem" />
        {/each}
      </div>
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
  {:else if tab === 'lineups'}
    <Card>
      <Skeleton width="12rem" height="1.2rem" />
      <div class="rows">
        {#each [1, 2, 3, 4, 5, 6, 7, 8] as row (row)}
          <Skeleton height="1.4rem" />
        {/each}
      </div>
    </Card>
  {:else if tab === 'weekly'}
    <Card>
      <Skeleton width="13rem" height="1.2rem" />
      <div class="chips">
        {#each [1, 2, 3, 4, 5, 6] as chip (chip)}
          <Skeleton width="5.5rem" height="1.8rem" />
        {/each}
      </div>
      <div class="chart"><Skeleton height="16rem" /></div>
    </Card>
    <Card>
      <Skeleton width="11rem" height="1.2rem" />
      <div class="rows">
        {#each [1, 2, 3, 4, 5, 6] as row (row)}
          <Skeleton height="1.4rem" />
        {/each}
      </div>
    </Card>
  {/if}
</div>

<style>
  .loading {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }

  .tiles {
    margin-top: 0.75rem;
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

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 1rem;
  }
</style>
