<script lang="ts">
  import type { SeasonTab } from '@/lib/router.svelte';
  import Card from '@/lib/ui/Card.svelte';

  let { tab }: { tab: SeasonTab } = $props();

  const COPY: Record<SeasonTab, { title: string; text: string }> = {
    overview: { title: 'Overview', text: '' },
    luck: {
      title: 'The luck map',
      text: 'Expected wins against actual wins, with every team labeled and the schedule alongside.',
    },
    lineups: {
      title: 'Lineups',
      text: 'Points scored and points left on the bench, ranked by efficiency.',
    },
    weekly: {
      title: 'Week by week',
      text: 'Every team against the league median, and who is steady or boom-or-bust.',
    },
  };
</script>

<Card title={COPY[tab].title} eyebrow="Coming soon">
  <p>{COPY[tab].text}</p>
</Card>

<style>
  p {
    margin: 0 0 0.5rem;
    color: var(--text-2);
    max-width: 40rem;
  }
</style>
