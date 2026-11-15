<script lang="ts">
  import { formatPercent } from '@/lib/format';

  let { value, label }: { value: number; label: string } = $props();

  const share = $derived(Math.min(Math.max(value, 0), 1) * 100);
</script>

<span class="meter" role="img" aria-label="{label}: {formatPercent(value)}">
  <span class="track" aria-hidden="true">
    <span class="fill" style:width="{share}%"></span>
  </span>
  <span class="value" aria-hidden="true">{formatPercent(value)}</span>
</span>

<style>
  .meter {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    justify-content: flex-start;
  }

  .track {
    width: 5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: var(--grid);
    overflow: hidden;
  }

  .fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--muted);
    transition: width var(--dur-slow) var(--ease-out);
  }

  .value {
    min-width: 3.2rem;
    text-align: right;
  }
</style>
