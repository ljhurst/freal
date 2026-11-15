import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { getContext } from 'svelte';
import { type Api, createApi } from '@/lib/api/client';
import { createDemoApi, isDemoMode } from '@/lib/api/demo';
import { Session } from '@/lib/auth/session.svelte';
import {
  API_BASE_URL,
  API_RESOURCE,
  LASSO_AUTHORITY,
  LASSO_CLIENT_ID,
  LASSO_SCOPE,
} from '@/lib/config';
import { Router } from '@/lib/router.svelte';
import { SeasonCache } from '@/lib/season/cache';
import { Theme } from '@/lib/theme.svelte';

export interface Services {
  api: Api;
  seasons: SeasonCache;
  router: Router;
  theme: Theme;
  /** Null in demo mode, which has no login. */
  session: Session | null;
}

export const SERVICES_KEY = Symbol('freal.services');

export function useServices(): Services {
  return getContext<Services>(SERVICES_KEY);
}

export function createServices(win: Window): Services {
  const router = new Router(win);
  const theme = new Theme(win.document.documentElement, safeStorage(win));
  if (isDemoMode(win.location)) {
    const demoApi = createDemoApi(win.fetch.bind(win));
    return { api: demoApi, seasons: new SeasonCache(demoApi), router, theme, session: null };
  }

  const session = new Session(
    new UserManager({
      authority: LASSO_AUTHORITY,
      client_id: LASSO_CLIENT_ID,
      redirect_uri: `${win.location.origin}/auth/callback`,
      post_logout_redirect_uri: `${win.location.origin}/`,
      response_type: 'code',
      scope: LASSO_SCOPE,
      extraQueryParams: { resource: API_RESOURCE },
      extraTokenParams: { resource: API_RESOURCE },
      userStore: new WebStorageStateStore({ store: win.localStorage }),
      automaticSilentRenew: true,
    }),
  );
  const api = createApi({
    baseUrl: API_BASE_URL,
    accessToken: () => session.accessToken(),
    onUnauthorized: async () => {
      await session.reauthenticate(win.location.pathname + win.location.search);
    },
  });
  return { api, seasons: new SeasonCache(api), router, theme, session };
}

function safeStorage(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}
