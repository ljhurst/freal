<script lang="ts">
  import { onMount } from 'svelte';
  import Footer from '@/components/Footer.svelte';
  import Header from '@/components/Header.svelte';
  import { useServices } from '@/lib/services';
  import AuthCallback from '@/views/AuthCallback.svelte';
  import Home from '@/views/Home.svelte';
  import NotFound from '@/views/NotFound.svelte';
  import Season from '@/views/Season.svelte';
  import SignedOut from '@/views/SignedOut.svelte';

  const { router, session } = useServices();

  onMount(() => {
    // The login callback establishes the session itself; reading storage first could overwrite it.
    if (router.route.name !== 'authCallback') {
      void session?.start();
    }
  });
</script>

<Header />
<main>
  {#if session && router.route.name === 'authCallback'}
    <AuthCallback />
  {:else if session?.status === 'loading'}
    <p class="status" role="status">Loading…</p>
  {:else if session?.status === 'signedOut'}
    <SignedOut />
  {:else if router.route.name === 'home'}
    <Home />
  {:else if router.route.name === 'season'}
    <Season leagueId={router.route.leagueId} year={router.route.year} tab={router.route.tab} />
  {:else}
    <NotFound />
  {/if}
</main>
<Footer />

<style>
  main {
    flex: 1;
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 1.5rem var(--gutter) 4rem;
  }

  .status {
    color: var(--muted);
  }
</style>
