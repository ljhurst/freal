<script lang="ts">
  import ComingSoon from '@/components/ComingSoon.svelte';
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import Hero from '@/components/Hero.svelte';
  import SeasonHeader from '@/components/SeasonHeader.svelte';
  import Standings from '@/components/Standings.svelte';
  import StatTiles from '@/components/StatTiles.svelte';
  import type { SeasonTab } from '@/lib/router.svelte';
  import { highlights as overview } from '@/lib/season/highlights';
  import { useServices } from '@/lib/services';
  import Card from '@/lib/ui/Card.svelte';
  import Skeleton from '@/lib/ui/Skeleton.svelte';

  let { leagueId, year, tab }: { leagueId: number; year: number; tab: SeasonTab } = $props();

  const { seasons } = useServices();
  const report = $derived(seasons.get(leagueId, year));
</script>

{#await report}
  <div class="loading" role="status">
    <span class="visually-hidden">Loading the {year} season…</span>
    <Skeleton width="9rem" height="0.9rem" />
    <Skeleton width="min(24rem, 80%)" height="2.6rem" />
    <Skeleton height="2.5rem" />
    <Skeleton height="14rem" />
  </div>
{:then season}
  <SeasonHeader name={season.name} {leagueId} {year} {tab} />
  {#key tab}
    {#if tab === 'overview'}
      {@const picks = overview(season)}
      <Hero highlights={picks} />
      <StatTiles highlights={picks} />
      <Card title="Standings" eyebrow="Record against what the scoring earned" index={6}>
        <Standings teams={season.teams} weeks={season.weeks} />
      </Card>
    {:else}
      <ComingSoon {tab} />
    {/if}
  {/key}
{:catch error}
  <ErrorPanel {error} />
{/await}

<style>
  .loading {
    display: grid;
    gap: 1rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
