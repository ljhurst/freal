<script lang="ts">
  import type { Snippet } from 'svelte';
  import Card from '@/lib/ui/Card.svelte';
  import ViewToggle, { type View } from '@/lib/ui/ViewToggle.svelte';

  let {
    title,
    index = 0,
    chart,
    table,
  }: { title: string; index?: number; chart: Snippet; table: Snippet } = $props();

  let view = $state<View>('chart');
</script>

<Card {title} {index}>
  {#snippet actions()}
    <ViewToggle bind:view />
  {/snippet}
  {#if view === 'chart'}
    {@render chart()}
  {:else}
    {@render table()}
  {/if}
</Card>
