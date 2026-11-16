<script lang="ts">
  import { useServices } from '@/lib/services';

  const { session } = useServices();

  let pending = $state(false);

  async function signIn(): Promise<void> {
    pending = true;
    try {
      await session?.signIn(window.location.pathname + window.location.search);
    } catch {
      pending = false;
    }
  }
</script>

<svelte:window onpageshow={(event) => event.persisted && (pending = false)} />

<section>
  <h1>Who's for real?</h1>
  <p>
    Luck, schedule strength and lineup efficiency for the family league. Log in to see how
    everyone is really doing.
  </p>
  <button type="button" onclick={signIn} disabled={pending} aria-busy={pending}>
    {#if pending}<span class="spinner" aria-hidden="true"></span>{/if}
    {pending ? 'Logging in' : 'Log in'}
  </button>
</section>

<style>
  section {
    max-width: 32rem;
    padding: 3rem 0;
  }

  h1 {
    font-size: clamp(2rem, 8vw, 3.25rem);
  }

  p {
    color: var(--muted);
    margin: 0 0 1.5rem;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--accent);
    color: var(--accent-ink);
    border: 0;
    border-radius: 999px;
    padding: 0.75rem 1.75rem;
    font-weight: 700;
    cursor: pointer;
  }

  button:disabled {
    cursor: progress;
    opacity: 0.85;
  }

  .spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 900ms linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: breathe 2s ease-in-out infinite;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
