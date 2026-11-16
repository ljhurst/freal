<script lang="ts">
  import { link } from '@/lib/link';
  import { useServices } from '@/lib/services';
  import ThemeToggle from '@/lib/ui/ThemeToggle.svelte';

  const { router, session } = useServices();

  const inLeagues = $derived(router.route.name === 'home' || router.route.name === 'season');
</script>

<header>
  <div class="bar">
    <a class="brand" href="/" use:link={router}>
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--accent)" />
        <path d="M10 23V9.5h11M10 16h8" stroke="var(--accent-ink)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </svg>
      <span class="wordmark">F<span class="tick">'</span>Real</span>
    </a>
    {#if session === null || session.status === 'signedIn'}
      <nav aria-label="Main">
        <a
          class="section"
          class:active={inLeagues}
          href="/"
          use:link={router}
          aria-current={router.route.name === 'home' ? 'page' : inLeagues ? 'true' : undefined}
        >
          Leagues
        </a>
        {#if session?.isAdmin}
          <a
            class="section"
            class:active={router.route.name === 'admin'}
            href="/admin"
            use:link={router}
            aria-current={router.route.name === 'admin' ? 'page' : undefined}
          >
            Access
          </a>
        {/if}
      </nav>
    {/if}
    <div class="actions">
      <ThemeToggle />
      {#if session?.status === 'signedIn'}
        <span class="who">{session.givenName}</span>
        <button type="button" class="signout" onclick={() => session.signOut()}>Sign out</button>
      {/if}
    </div>
  </div>
  {#if session === null}
    <p class="demo" role="note">Demo data. The real dashboard needs a login.</p>
  {/if}
</header>

<style>
  header {
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0.65rem var(--gutter);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 800;
    font-size: 1.25rem;
    letter-spacing: -0.04em;
    text-decoration: none;
  }

  .tick {
    color: var(--accent);
  }

  nav {
    flex: 1;
    display: flex;
    gap: 1rem;
    margin-left: 1.25rem;
  }

  .section {
    position: relative;
    display: inline-block;
    padding: 0.5rem 0.25rem;
    color: var(--muted);
    font-weight: 650;
    text-decoration: none;
    transition: color var(--dur-fast) var(--ease-out);
  }

  .section:hover,
  .section.active {
    color: var(--text);
  }

  .section::after {
    content: '';
    position: absolute;
    left: 0.25rem;
    right: 0.25rem;
    bottom: -0.7rem;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--accent);
    transform: scaleX(0);
    transition: transform var(--dur) var(--ease-out);
  }

  .section.active::after {
    transform: scaleX(1);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--muted);
  }

  .signout {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out);
  }

  .signout:hover {
    background: var(--surface-raised);
  }

  .demo {
    margin: 0;
    padding: 0.4rem var(--gutter);
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    background: var(--accent);
    color: var(--accent-ink);
  }

  @media (max-width: 30rem) {
    .who {
      display: none;
    }
  }
</style>
