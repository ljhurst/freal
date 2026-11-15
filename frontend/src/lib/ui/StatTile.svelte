<script lang="ts">
  let {
    label,
    name,
    figure,
    tone = 'plain',
    index = 0,
  }: {
    label: string;
    name: string;
    figure: string;
    tone?: 'plain' | 'lucky' | 'unlucky';
    index?: number;
  } = $props();
</script>

<div class="tile rise" style:--i={index}>
  <p class="eyebrow">{label}</p>
  <p class="name">{name}</p>
  <p class="figure">
    {#if tone !== 'plain'}<span class="mark {tone}" aria-hidden="true">{tone === 'lucky' ? '▲' : '▼'}</span>{/if}
    {figure}
  </p>
</div>

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
  }

  p {
    margin: 0;
  }

  .name {
    margin-top: 0.4rem;
    font-size: 1.15rem;
    font-weight: 750;
    letter-spacing: -0.015em;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .figure {
    margin-top: auto;
    padding-top: 0.6rem;
    border-top: 1px solid var(--border);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-2);
  }

  .name {
    margin-bottom: 0.85rem;
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
