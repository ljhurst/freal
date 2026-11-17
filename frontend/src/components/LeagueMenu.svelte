<script lang="ts">
  import type { LeagueSummary } from '@/lib/api/client';
  import { seasonPath } from '@/lib/router.svelte';
  import Menu from '@/lib/ui/Menu.svelte';

  let { leagues, leagueId }: { leagues: LeagueSummary[]; leagueId: number } = $props();

  const current = $derived(leagues.find((league) => league.league_id === leagueId));
  const items = $derived(
    leagues.flatMap((league) => {
      const latest = league.years.at(-1);
      return latest === undefined
        ? []
        : [
            {
              href: seasonPath(league.league_id, latest),
              label: league.name,
              current: league.league_id === leagueId,
            },
          ];
    }),
  );
</script>

<Menu label={current?.name ?? ''} {items} />
