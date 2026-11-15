<script lang="ts">
  import type { Snippet } from 'svelte';
  import HelpButton from '@/lib/ui/HelpButton.svelte';
  import HelpPanel from '@/lib/ui/HelpPanel.svelte';

  let {
    title,
    index = 0,
    actions,
    help,
    children,
  }: {
    title?: string;
    index?: number;
    actions?: Snippet;
    /** Plain words on how to read the card, behind an (i) next to the title. */
    help?: Snippet;
    children: Snippet;
  } = $props();

  const helpId = $props.id();
  let helpOpen = $state(false);
</script>

<section class="card rise" style:--i={index}>
  {#if title || actions}
    <header>
      <div class="heading">
        {#if title}<h2>{title}</h2>{/if}
        {#if help}
          <HelpButton label="How to read this: {title ?? 'card'}" controls={helpId} bind:open={helpOpen} />
        {/if}
      </div>
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </header>
    {#if help}
      <HelpPanel id={helpId} open={helpOpen}>{@render help()}</HelpPanel>
    {/if}
  {/if}
  {@render children()}
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.25rem 1.25rem 1rem;
  }


  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .heading {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  h2 {
    font-size: 1.15rem;
    margin: 0;
  }
</style>
