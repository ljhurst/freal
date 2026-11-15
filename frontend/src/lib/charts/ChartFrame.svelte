<script lang="ts">
  import type { Snippet } from 'svelte';
  import Card from '@/lib/ui/Card.svelte';
  import ViewToggle, { type View } from '@/lib/ui/ViewToggle.svelte';

  let {
    title,
    index = 0,
    controls,
    help,
    chart,
    table,
  }: {
    title: string;
    index?: number;
    /** Shown above both views, so a choice can be changed from either. */
    controls?: Snippet;
    /** Plain words on how to read this card. */
    help?: Snippet;
    chart: Snippet;
    table: Snippet;
  } = $props();

  let view = $state<View>('chart');
</script>

<Card {title} {index} {help}>
  {#snippet actions()}
    <ViewToggle bind:view />
  {/snippet}
  {@render controls?.()}
  {#if view === 'chart'}
    {@render chart()}
  {:else}
    {@render table()}
  {/if}
</Card>
