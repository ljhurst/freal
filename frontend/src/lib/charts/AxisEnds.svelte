<script lang="ts">
  let { low, high, marker }: { low: number; high: number; marker?: { at: number; label: string } } =
    $props();
</script>

<span class="scale">
  <span class="end">{low}</span>
  {#if marker}
    <span class="marker" style:left="{marker.at}%">{marker.label}</span>
  {/if}
  <span class="end right">{high}</span>
</span>

<style>
  .scale {
    position: relative;
    display: block;
    height: 1.6rem;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .end {
    position: absolute;
    left: 0;
    bottom: 0.2rem;
  }

  .right {
    left: auto;
    right: 0;
  }

  .marker {
    position: absolute;
    bottom: 0.2rem;
    transform: translateX(-50%);
    white-space: nowrap;
  }
</style>
