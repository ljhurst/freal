import type { User } from 'oidc-client-ts';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

const ADMIN_SCOPE = 'freal:admin';
const LAST_SIGN_IN_KEY = 'freal.last-sign-in';
const LOOP_WINDOW_MS = 60_000;

/** The part of oidc-client-ts's UserManager the session uses. */
export interface OidcClient {
  getUser(): Promise<User | null>;
  signinRedirect(args?: { state?: unknown }): Promise<void>;
  signinRedirectCallback(): Promise<User>;
  signoutRedirect(): Promise<void>;
}

export class Session {
  status = $state<SessionStatus>('loading');
  givenName = $state('');
  isAdmin = $state(false);

  constructor(
    private readonly client: OidcClient,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> = globalThis.sessionStorage,
    private readonly now: () => number = Date.now,
  ) {}

  async start(): Promise<void> {
    this.apply(await this.client.getUser());
  }

  async signIn(returnTo: string): Promise<void> {
    this.storage.setItem(LAST_SIGN_IN_KEY, String(this.now()));
    await this.client.signinRedirect({ state: returnTo });
  }

  /**
   * Restarts the login after the API rejected a token. Returns false, without redirecting, when
   * a login was only just started: the API would reject the new token too, and the page would loop.
   */
  async reauthenticate(returnTo: string): Promise<boolean> {
    const last = Number(this.storage.getItem(LAST_SIGN_IN_KEY) ?? 0);
    if (this.now() - last < LOOP_WINDOW_MS) {
      return false;
    }
    await this.signIn(returnTo);
    return true;
  }

  /** Finishes the login redirect and returns the path the user started from. */
  async completeSignIn(): Promise<string> {
    const user = await this.client.signinRedirectCallback();
    this.apply(user);
    return typeof user.state === 'string' ? user.state : '/';
  }

  async signOut(): Promise<void> {
    await this.client.signoutRedirect();
  }

  async accessToken(): Promise<string | null> {
    const user = await this.client.getUser();
    this.apply(user);
    return user && !user.expired ? user.access_token : null;
  }

  private apply(user: User | null): void {
    if (user && !user.expired) {
      this.status = 'signedIn';
      this.givenName = user.profile.given_name ?? user.profile.name ?? '';
      this.isAdmin = user.scopes.includes(ADMIN_SCOPE);
    } else {
      this.status = 'signedOut';
      this.givenName = '';
      this.isAdmin = false;
    }
  }
}
