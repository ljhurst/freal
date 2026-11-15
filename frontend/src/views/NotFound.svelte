<script lang="ts">
  import { link } from '@/lib/link';
  import { useServices } from '@/lib/services';

  const { router } = useServices();
</script>

<section>
  <h1>Not found</h1>
  <p>There's nothing at this address. <a href="/" use:link={router}>Back to your leagues</a>.</p>
</section>

<style>
  p {
    color: var(--muted);
  }
</style>
