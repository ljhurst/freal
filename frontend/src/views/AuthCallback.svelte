<script lang="ts">
  import { onMount } from 'svelte';
  import { useServices } from '@/lib/services';

  const { router, session } = useServices();
  let failed = $state(false);

  onMount(async () => {
    if (session === null) {
      return;
    }
    try {
      router.replace(await session.completeSignIn());
    } catch {
      failed = true;
    }
  });

  function retry(): void {
    void session?.signIn('/');
  }
</script>

{#if failed}
  <section role="alert">
    <h1>Login didn't finish</h1>
    <p>Something went wrong while signing you in.</p>
    <button type="button" onclick={retry}>Try again</button>
  </section>
{:else}
  <p class="status" role="status">Signing you in…</p>
{/if}

<style>
  .status,
  p {
    color: var(--muted);
  }

  button {
    background: var(--accent);
    color: var(--accent-ink);
    border: 0;
    border-radius: 999px;
    padding: 0.6rem 1.5rem;
    font-weight: 700;
    cursor: pointer;
  }
</style>
