<script lang="ts">
  import { useServices } from '@/lib/services';

  const { api, session } = useServices();
  const siteVersion = __APP_VERSION__;

  let apiVersion = $state<string | null>(null);

  $effect(() => {
    if (session !== null && session.status !== 'signedIn') return;
    api.version().then(
      (version) => {
        apiVersion = version;
      },
      () => {
        apiVersion = null;
      },
    );
  });
</script>

<footer>
  <p>
    site v{siteVersion}{#if apiVersion !== null}{' '}· api v{apiVersion}{/if}
  </p>
</footer>

<style>
  footer {
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 1.25rem var(--gutter);
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 0.8rem;
  }

  p {
    margin: 0;
  }
</style>
