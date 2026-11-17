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
  <div class="league rise">
    {#if options === null}
      <Skeleton width="min(20rem, 70%)" height="2.6rem" />
    {:else if switchesLeagues && options}
      <h1 class="visually-hidden">{current?.name}</h1>
      <LeagueMenu leagues={options} {leagueId} />
    {:else}
      <h1>{current?.name ?? 'League'}</h1>
    {/if}
  </div>

  {#if options !== null}
    <div class="season rise" style:--i="1">
      <Menu size="year" name="Season" label={String(year)} items={seasons} disabled={loading} />
    </div>
  {/if}

  <div class="tabs rise" style:--i="2">
    <Tabs {items} active={tab} {router} label="Season views" />
  </div>
</header>

<style>
  header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'league season'
      'tabs tabs';
    align-items: baseline;
    gap: 0.75rem 1rem;
    margin-bottom: 1.25rem;
  }

  h1 {
    font-size: clamp(1.9rem, 6vw, 3rem);
    font-weight: 800;
    margin: 0;
  }

  /* The menus hang below their buttons, so both regions must paint above the tabs row. */
  .league,
  .season {
    position: relative;
    z-index: 2;
    min-width: 0;
  }

  /* The league list can reach down over the year, so the league region sits above it. */
  .league {
    grid-area: league;
    z-index: 3;
  }

  /* The year's list hangs from the edge the year sits at: right beside the title, left once stacked. */
  .season {
    grid-area: season;
    --menu-left: auto;
    --menu-right: 0;
  }

  .tabs {
    grid-area: tabs;
    border-bottom: 1px solid var(--border);
  }

  @media (max-width: 36rem) {
    header {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'league'
        'season'
        'tabs';
      row-gap: 1rem;
    }

    .season {
      --menu-left: 0;
      --menu-right: auto;
    }
  }
</style>
