<script lang="ts">
  import type { LeagueSummary } from '@/lib/api/client';
  import { type SeasonTab, seasonPath } from '@/lib/router.svelte';
  import { useServices } from '@/lib/services';
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
  const hasSeasonPicker = $derived((current?.years.length ?? 0) > 1);

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

  function pickYear(event: Event): void {
    const picked = Number((event.currentTarget as HTMLSelectElement).value);
    router.navigate(seasonPath(leagueId, picked, tab));
  }

  function pickLeague(event: Event, options: { league_id: number; years: number[] }[]): void {
    const picked = Number((event.currentTarget as HTMLSelectElement).value);
    const latest = options.find((league) => league.league_id === picked)?.years.at(-1);
    if (latest !== undefined) {
      router.navigate(seasonPath(picked, latest));
    }
  }
</script>

<header>
  <div class="title rise">
    {#if options === null}
      <Skeleton width="min(20rem, 70%)" height="2.6rem" />
    {:else}
      {#if !hasSeasonPicker}<p class="eyebrow">{year} season</p>{/if}
      <h1>{current?.name ?? 'League'}</h1>
    {/if}
  </div>

  {#if options !== null}
    <div class="switchers rise" style:--i="1">
      {#if options.length > 1}
        <label>
          <span class="eyebrow">League</span>
          <select value={leagueId} onchange={(event) => pickLeague(event, options ?? [])}>
            {#each options as league (league.league_id)}
              <option value={league.league_id}>{league.name}</option>
            {/each}
          </select>
        </label>
      {/if}
      {#if current && hasSeasonPicker}
        <label>
          <span class="eyebrow">Season</span>
          <select value={year} onchange={pickYear} disabled={loading}>
            {#each current.years as option (option)}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  {/if}

  <div class="tabs rise" style:--i="2">
    <Tabs {items} active={tab} {router} label="Season views" />
  </div>
</header>

<style>
  header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 0.75rem 1.5rem;
    margin-bottom: 1.25rem;
  }

  h1 {
    font-size: clamp(1.9rem, 6vw, 3rem);
    font-weight: 800;
    margin: 0;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
  }

  .switchers {
    display: flex;
    gap: 0.75rem;
  }

  label {
    display: grid;
  }

  label .eyebrow {
    margin-bottom: 0.2rem;
  }

  select:disabled {
    cursor: progress;
    opacity: 0.6;
  }

  select {
    appearance: none;
    padding: 0.45rem 2rem 0.45rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background-color: var(--surface);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%238d97b0' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    color: var(--text);
    cursor: pointer;
  }

  .tabs {
    grid-column: 1 / -1;
    border-bottom: 1px solid var(--border);
  }

  @media (max-width: 36rem) {
    header {
      grid-template-columns: 1fr;
    }
  }
</style>
