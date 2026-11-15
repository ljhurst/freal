<script lang="ts">
  import { formatPercent, formatPoints, formatSigned } from '@/lib/format';
  import type { Highlights } from '@/lib/season/highlights';
  import StatTile from '@/lib/ui/StatTile.svelte';

  let { highlights }: { highlights: Highlights } = $props();

  const tiles = $derived(
    [
      highlights.luckiest && {
        label: 'Luckiest',
        name: highlights.luckiest.team.name,
        figure: `${formatSigned(highlights.luckiest.value)} wins`,
        tone: 'lucky' as const,
      },
      highlights.unluckiest && {
        label: 'Unluckiest',
        name: highlights.unluckiest.team.name,
        figure: `${formatSigned(highlights.unluckiest.value)} wins`,
        tone: 'unlucky' as const,
      },
      highlights.mostEfficient && {
        label: 'Best manager',
        name: highlights.mostEfficient.team.name,
        figure: `${formatPercent(highlights.mostEfficient.value)} of optimal points`,
      },
      highlights.topWeek && {
        label: 'Top week',
        name: highlights.topWeek.team.name,
        figure: `${formatPoints(highlights.topWeek.value)} points in week ${highlights.topWeek.week}`,
      },
      highlights.steadiest && {
        label: 'Steadiest',
        name: highlights.steadiest.team.name,
        figure: `±${highlights.steadiest.value.toFixed(1)} points a week`,
      },
    ].filter((tile) => tile !== null),
  );
</script>

{#if tiles.length > 0}
  <div class="tiles">
    {#each tiles as tile, index (tile.label)}
      <StatTile {...tile} index={index + 1} />
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
