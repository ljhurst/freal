<script lang="ts">
  let { width = '100%', height = '1rem' }: { width?: string; height?: string } = $props();
</script>

<span class="skeleton" style:width style:height aria-hidden="true"></span>

<style>
  .skeleton {
    display: block;
    border-radius: var(--radius-sm);
    background-color: var(--surface-raised);
    background-image: linear-gradient(
      100deg,
      transparent 30%,
      color-mix(in srgb, var(--text) 12%, transparent) 50%,
      transparent 70%
    );
    background-size: 250% 100%;
    background-repeat: no-repeat;
    animation: shimmer 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      background-image: none;
      animation: breathe 2s ease-in-out infinite;
    }
  }

  @keyframes breathe {
    50% {
      opacity: 0.55;
    }
  }

  @keyframes shimmer {
    from {
      background-position: 150% 0;
    }
    to {
      background-position: -50% 0;
    }
  }
</style>
