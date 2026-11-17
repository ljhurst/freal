<script lang="ts">
  import LeagueMenu from '@/components/LeagueMenu.svelte';
  import type { LeagueSummary } from '@/lib/api/client';
  import { type SeasonTab, seasonPath } from '@/lib/router.svelte';
  import { useServices } from '@/lib/services';
  import Menu from '@/lib/ui/Menu.svelte';
  import Skeleton from '@/lib/ui/Skeleton.svelte';
  import Tabs from '@/lib/ui/Tabs.svelte';

  let {
    leagueId,
    year,
    tab,
    loading = false,
  }: { leagueId: number; year: number; tab: SeasonTab; loading?: boolean } = $props();

  const { leagues, router } = useServices();

  let options = $state<LeagueSummary[] | null>(leagues.peek() ?? null);
  void leagues.get().then(
    (list) => {
      options = list;
    },
    () => {
      options = [];
    },
  );

  const current = $derived(options?.find((league) => league.league_id === leagueId));
  const switchesLeagues = $derived((options?.length ?? 0) > 1 && current !== undefined);

  const TABS: readonly { id: SeasonTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'luck', label: 'Luck' },
    { id: 'lineups', label: 'Lineups' },
    { id: 'weekly', label: 'Weekly' },
  ];

  const items = $derived(
    TABS.map((entry) => ({
      id: entry.id,
      label: entry.label,
      href: seasonPath(leagueId, year, entry.id),
    })),
  );

  const seasons = $derived(
    [...(current?.years ?? [])].reverse().map((option) => ({
      href: seasonPath(leagueId, option, tab),
      label: String(option),
      current: option === year,
    })),
  );
</script>

<header>
  <div class="title rise">
    {#if options === null}
      <Skeleton width="min(20rem, 70%)" height="2.6rem" />
    {:else}
      {#if switchesLeagues && options}
        <h1 class="visually-hidden">{current?.name}</h1>
        <LeagueMenu leagues={options} {leagueId} />
      {:else}
        <h1>{current?.name ?? 'League'}</h1>
      {/if}
      <Menu size="year" name="Season" label={String(year)} items={seasons} disabled={loading} />
    {/if}
  </div>

  <div class="tabs rise" style:--i="2">
    <Tabs {items} active={tab} {router} label="Season views" />
  </div>
</header>

<style>
  header {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  h1 {
    font-size: clamp(1.9rem, 6vw, 3rem);
    font-weight: 800;
    margin: 0;
  }

  /* The menus hang below the title, so it must paint above the tabs row. */
  .title {
    position: relative;
    z-index: 2;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    column-gap: 1rem;
  }

  .tabs {
    border-bottom: 1px solid var(--border);
  }
</style>
