<script lang="ts">
  export interface LegendItem {
    label: string;
    kind: 'lucky' | 'unlucky' | 'neutral' | 'stamp' | 'dash';
  }

  let { items }: { items: readonly LegendItem[] } = $props();
</script>

<ul class="legend" aria-label="Legend">
  {#each items as item (item.label)}
    <li><span class="swatch {item.kind}"></span>{item.label}</li>
  {/each}
</ul>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.1rem;
    margin: 0.75rem 0 0;
    padding: 0;
    list-style: none;
    color: var(--text-2);
    font-size: 0.82rem;
  }

  li {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .swatch {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
  }

  .lucky {
    background: var(--lucky);
  }

  .unlucky {
    background: var(--unlucky);
  }

  .neutral {
    background: var(--neutral);
  }

  .stamp {
    margin-left: 0.2rem;
    background: var(--neutral);
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 4px var(--accent);
  }

  .dash {
    width: 1.1rem;
    height: 0;
    border-top: 2px dashed var(--axis);
    border-radius: 0;
  }
</style>
