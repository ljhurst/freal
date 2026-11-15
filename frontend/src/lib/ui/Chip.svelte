<script lang="ts">
  let { tone, label }: { tone: 'lucky' | 'unlucky' | 'neutral'; label: string } = $props();

  const GLYPHS = { lucky: '▲', unlucky: '▼', neutral: '●' } as const;
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
