<script lang="ts">
  import { formatPercent, formatPoints, formatSigned } from '@/lib/format';
  import { seasonPath, teamPath } from '@/lib/router.svelte';
  import type { Highlights } from '@/lib/season/highlights';
  import { useServices } from '@/lib/services';
  import StatTile from '@/lib/ui/StatTile.svelte';

  let { highlights, leagueId, year }: { highlights: Highlights; leagueId: number; year: number } =
    $props();

  const { router } = useServices();

  const tiles = $derived(
    [
      highlights.luckiest && {
        label: 'Luckiest',
        name: highlights.luckiest.team.name,
        figure: `${formatSigned(highlights.luckiest.value)} wins`,
        tone: 'lucky' as const,
        href: seasonPath(leagueId, year, 'luck'),
      },
      highlights.unluckiest && {
        label: 'Unluckiest',
        name: highlights.unluckiest.team.name,
        figure: `${formatSigned(highlights.unluckiest.value)} wins`,
        tone: 'unlucky' as const,
        href: seasonPath(leagueId, year, 'luck'),
      },
      highlights.mostEfficient && {
        label: 'Best manager',
        name: highlights.mostEfficient.team.name,
        figure: `${formatPercent(highlights.mostEfficient.value)} of optimal points`,
        href: seasonPath(leagueId, year, 'lineups'),
      },
      highlights.topWeek && {
        label: 'Top week',
        name: highlights.topWeek.team.name,
        figure: `${formatPoints(highlights.topWeek.value)} points in week ${highlights.topWeek.week}`,
        href: teamPath(leagueId, year, highlights.topWeek.team.team_id),
      },
      highlights.steadiest && {
        label: 'Steadiest',
        name: highlights.steadiest.team.name,
        figure: `±${highlights.steadiest.value.toFixed(1)} points per week`,
        href: teamPath(leagueId, year, highlights.steadiest.team.team_id),
      },
    ].filter((tile) => tile !== null),
  );
</script>

{#if tiles.length > 0}
  <div class="tiles">
    {#each tiles as tile, index (tile.label)}
      <StatTile {...tile} {router} index={index + 1} />
    {/each}
  </div>
{/if}

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
</style>
