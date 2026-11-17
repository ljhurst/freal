<script lang="ts">
  import { link } from '@/lib/link';
  import type { Router } from '@/lib/router.svelte';
  import Trophy from '@/lib/ui/Trophy.svelte';

  let {
    label,
    name,
    champion = false,
    figure,
    tone = 'plain',
    index = 0,
    href,
    router,
  }: {
    label: string;
    name: string;
    champion?: boolean;
    figure: string;
    tone?: 'plain' | 'lucky' | 'unlucky';
    index?: number;
    /** Makes the whole tile a link; needs the router for client-side navigation. */
    href?: string;
    router?: Router;
  } = $props();
</script>

{#snippet body()}
  <p class="eyebrow">{label}</p>
  <p class="name">{name}{#if champion}<Trophy />{/if}</p>
  <p class="figure">
    <span>
      {#if tone !== 'plain'}<span class="mark {tone}" aria-hidden="true">{tone === 'lucky' ? '▲' : '▼'}</span>{/if}
      {figure}
    </span>
    {#if href}<span class="go" aria-hidden="true">→</span>{/if}
  </p>
{/snippet}

{#if href && router}
  <a class="tile linked rise" style:--i={index} {href} use:link={router}>
    {@render body()}
  </a>
{:else}
  <div class="tile rise" style:--i={index}>
    {@render body()}
  </div>
{/if}

<style>
  .tile {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 0.9rem 1rem;
    min-width: 0;
    display: flex;
    flex-direction: column;
    color: inherit;
    text-decoration: none;
  }

  .linked {
    transition:
      border-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }

  .linked:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  p {
    margin: 0;
  }

  .name {
    margin-top: 0.4rem;
    margin-bottom: 0.85rem;
    font-size: 1.15rem;
    font-weight: 750;
    letter-spacing: -0.015em;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .figure {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-2);
  }

  .go {
    color: var(--muted);
    transition: color var(--dur-fast) var(--ease-out);
  }

  .linked:hover .go {
    color: var(--accent);
  }

  .mark {
    font-size: 0.7rem;
    margin-right: 0.3rem;
  }

  .lucky {
    color: var(--lucky);
  }

  .unlucky {
    color: var(--unlucky);
  }
</style>
