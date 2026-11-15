<script lang="ts">
  import { useServices } from '@/lib/services';

  const { session } = useServices();

  function signIn(): void {
    void session?.signIn(window.location.pathname + window.location.search);
  }
</script>

<section>
  <h1>Who's for real?</h1>
  <p>
    Luck, schedule strength and lineup efficiency for the family league. Log in to see how
    everyone is really doing.
  </p>
  <button type="button" onclick={signIn}>Log in</button>
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
    background: var(--accent);
    color: var(--accent-ink);
    border: 0;
    border-radius: 999px;
    padding: 0.75rem 1.75rem;
    font-weight: 700;
    cursor: pointer;
  }
</style>
