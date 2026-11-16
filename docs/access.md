# Who can see which league

freal fetches ESPN data with ESPN session cookies (`espn_s2` and `SWID`). ESPN has
no OAuth and no programmatic login, so cookies can only be copied by hand from a
logged-in browser, and a cookie set can only load the leagues its account belongs
to. Today one shared cookie set (Luke's) serves every user, so every user sees
every configured league. Access has to be decided by freal, not by ESPN.

## Decisions

- **Lasso proves who the user is; freal decides what they see.** Scopes stay
  coarse (`freal:read` to use the app, `freal:connect` to store cookies).
  Per-league access is not a scope, because scopes describe what a client may do,
  not which resources a user owns.
- **Access is keyed by Lasso `sub`.** Email is not assumed to be in the token.
- **Not-a-member is a 404, not a 403,** so league ids don't leak.
- **No capture flow for ESPN cookies.** A page on our domain can't read ESPN's
  cookies, and a browser extension is too much to own for a hobby app. Pasting by
  hand is the only path.

## Stage 1: default cookies and a member table

Luke's cookies fetch every configured league. Each league lists the `sub`s allowed
to see it.

- Membership lives in one SSM parameter, `/freal/access`: per league, a list of
  `{sub, label}`. No parameter means non-admins see nothing.
- `GET /leagues` returns only leagues the caller is a member of.
- `GET /leagues/{id}/seasons/{year}` returns 404 for non-members.
- Callers with the `freal:admin` scope see every league and edit membership on the
  Access page (`GET /admin/access`, `PUT /admin/leagues/{id}/members`).
- Subs come from the Lasso admin portal.

Limit: freal only shows leagues Luke's ESPN account is in.

## Stage 2: personal cookies as an escape hatch

A user who wants a league Luke isn't in pastes their own cookies and a league id.

- The server loads that league with their cookies. If ESPN lets them in, they are a
  member; ESPN has proven it, so no table entry and no admin.
- Cookies are stored per user (`/freal/espn/user/<sub>`) and used only for that
  user's requests.
- `GET /leagues` returns the union of their default-league memberships and the
  leagues their own cookies can load.
- `POST /connect` stops taking an `account` and writes to the caller's own slot.
  Today any holder of `freal:connect` can overwrite any account's cookies, Luke's
  included; this removes that.
- Personal leagues are fetched and cached per user, not per league.
- Expired cookies show "reconnect" on that league only.

Open items before building:

- How long `espn_s2` lasts is unknown; check the logs for when Luke's last failed.
- Whether ESPN has an endpoint listing a user's leagues from their `SWID`. If not,
  the user enters the league id and first year.

## Not doing

- **Everyone connects their own cookies.** Stores every user's full ESPN session,
  needs devtools skills most friends won't have, and splits the cache per user.
- **Matching users to ESPN team owners (`Team.owner_id`).** Needs each user to link
  an ESPN identity and locks out members who don't play, such as a commissioner.
- **One scope per league.** Works for a handful of leagues, but puts app data in
  Lasso and grows the token with every league.
