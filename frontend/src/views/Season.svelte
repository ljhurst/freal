<script lang="ts">
  import ErrorPanel from '@/components/ErrorPanel.svelte';
  import Hero from '@/components/Hero.svelte';
  import LineupsView from '@/components/LineupsView.svelte';
  import LuckView from '@/components/LuckView.svelte';
  import SeasonHeader from '@/components/SeasonHeader.svelte';
  import SeasonSkeleton from '@/components/SeasonSkeleton.svelte';
  import Standings from '@/components/Standings.svelte';
  import StatTiles from '@/components/StatTiles.svelte';
  import WeeklyView from '@/components/WeeklyView.svelte';
  import type { SeasonTab } from '@/lib/router.svelte';
  import { highlights as overview } from '@/lib/season/highlights';
  import { useServices } from '@/lib/services';
  import Card from '@/lib/ui/Card.svelte';

  let {
    leagueId,
    year,
    tab,
    team,
  }: { leagueId: number; year: number; tab: SeasonTab; team?: number } = $props();

  const { seasons } = useServices();
  const report = $derived(seasons.get(leagueId, year));

  let loading = $state(true);

  $effect(() => {
    const current = report;
    loading = true;
    const settle = () => {
      if (current === report) loading = false;
    };
    current.then(settle, settle);
  });
</script>

<SeasonHeader {leagueId} {year} {tab} {loading} />

{#await report}
  <SeasonSkeleton {tab} {year} />
{:then season}
  {#key tab}
    {#if tab === 'overview'}
      {@const picks = overview(season)}
      <Hero highlights={picks} />
      <StatTiles highlights={picks} />
      <Card title="Standings" index={6}>
        <Standings teams={season.teams} weeks={season.weeks} />
      </Card>
    {:else if tab === 'luck'}
      <LuckView {season} />
    {:else if tab === 'lineups'}
      <LineupsView {season} />
    {:else if tab === 'weekly'}
      <WeeklyView {season} {leagueId} {year} requestedTeam={team} />
    {/if}
  {/key}
{:catch error}
  <ErrorPanel {error} />
{/await}
