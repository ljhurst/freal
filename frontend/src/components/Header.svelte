<script lang="ts">
  import { link } from '@/lib/link';
  import { useServices } from '@/lib/services';

  const { router, session } = useServices();
</script>

<header>
  <div class="bar">
    <a class="brand" href="/" use:link={router}>freal</a>
    {#if session?.status === 'signedIn'}
      <div class="who">
        <span>{session.givenName}</span>
        <button type="button" onclick={() => session.signOut()}>Sign out</button>
      </div>
    {/if}
  </div>
  {#if session === null}
    <p class="demo" role="note">Demo data. The real dashboard needs a login.</p>
  {/if}
</header>

<style>
  header {
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0.75rem var(--gutter);
  }

  .brand {
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.04em;
    text-decoration: none;
    color: var(--accent);
  }

  .who {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--muted);
  }

  .who button {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.25rem 0.85rem;
    cursor: pointer;
  }

  .demo {
    margin: 0;
    padding: 0.4rem var(--gutter);
    text-align: center;
    font-size: 0.85rem;
    background: var(--warn);
    color: var(--accent-ink);
  }
</style>
