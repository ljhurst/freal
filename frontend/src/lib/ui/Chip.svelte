<script lang="ts">
  import type { Tone } from '@/lib/verdict';

  let { tone, label }: { tone: Tone; label: string } = $props();

  const GLYPHS = {
    forReal: '✓',
    hunt: '◐',
    fraud: '✕',
    lucky: '▲',
    unlucky: '▼',
    neutral: '●',
  } as const satisfies Record<Tone, string>;
</script>

<span class="chip">
  <span class="mark {tone}" aria-hidden="true">{GLYPHS[tone]}</span>
  {label}
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.15rem 0.65rem 0.15rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-raised);
    color: var(--text);
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .mark {
    font-size: 0.65rem;
  }

  .forReal {
    color: var(--accent);
  }

  .hunt {
    color: var(--accent);
  }

  .fraud {
    color: var(--lucky);
  }

  .chip:has(.forReal) {
    border-color: var(--accent);
  }

  .chip:has(.fraud) {
    border-color: var(--lucky);
  }

  .lucky {
    color: var(--lucky);
  }

  .unlucky {
    color: var(--unlucky);
  }

  .neutral {
    color: var(--neutral);
  }
</style>
