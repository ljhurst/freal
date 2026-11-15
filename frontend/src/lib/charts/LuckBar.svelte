<script lang="ts">
  import { formatSigned } from '@/lib/format';

  let { luck, limit }: { luck: number; limit: number } = $props();

  const share = $derived(Math.min(Math.abs(luck) / limit, 1) * 50);
  const side = $derived(luck > 0 ? 'lucky' : luck < 0 ? 'unlucky' : 'even');
  const wins = $derived(Math.abs(Math.round(luck * 10) / 10).toFixed(1));
  const label = $derived(
    luck > 0
      ? `${wins} wins luckier than expected`
      : luck < 0
        ? `${wins} wins unluckier than expected`
        : 'Record matches expected',
  );
</script>

<span class="luck" role="img" aria-label={label}>
  <span class="track" aria-hidden="true">
    <span class="bar {side}" style:width="{share}%"></span>
  </span>
  <span class="value" aria-hidden="true">{formatSigned(luck)}</span>
</span>

<style>
  .luck {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    justify-content: flex-start;
  }

  .track {
    position: relative;
    width: 5.5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: var(--grid);
  }

  .track::after {
    content: '';
    position: absolute;
    inset: -0.2rem auto -0.2rem 50%;
    width: 1px;
    background: var(--axis);
  }

  @media (max-width: 36rem) {
    .track {
      display: none;
    }
  }

  .bar {
    position: absolute;
    top: 0;
    bottom: 0;
    transition: width var(--dur-slow) var(--ease-out);
  }

  .lucky {
    left: 50%;
    background: var(--lucky);
    border-radius: 0 999px 999px 0;
  }

  .unlucky {
    right: 50%;
    background: var(--unlucky);
    border-radius: 999px 0 0 999px;
  }

  .value {
    min-width: 2.4rem;
    text-align: right;
  }
</style>
