import type { User } from 'oidc-client-ts';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

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

  constructor(private readonly client: OidcClient) {}

  async start(): Promise<void> {
    this.apply(await this.client.getUser());
  }

  async signIn(returnTo: string): Promise<void> {
    await this.client.signinRedirect({ state: returnTo });
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
    } else {
      this.status = 'signedOut';
      this.givenName = '';
    }
  }
}
