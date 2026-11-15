# freal

Who's for real? Advanced metrics and a dashboard for ESPN fantasy football leagues.

freal reads a private ESPN league with one shared set of ESPN cookies, computes
luck, schedule strength, lineup efficiency and consistency for every team, and
serves the result to people who log in through [Lasso](https://lasso.bylukehurst.com).

## How it works

- `src/freal/integrations/` talks to outside services: `espn/` fetches a season and
  maps it into typed models, `lasso/` verifies login tokens.
- `src/freal/metrics/` and `src/freal/reports/` turn a season into the report.
- `src/freal/storage/` reads and writes the SSM parameters: league config and cookies.
- `src/freal/operations/` holds the entry points: `service.py` is the application
  logic with no HTTP in it, `api.py` is the HTTP layer (FastAPI on a Lambda Function
  URL), and `lambda_handler.py` wires them together. Every route needs a Lasso access
  token: `freal:read` to see data, `freal:connect` to store fresh ESPN cookies.
- League config and cookies live in SSM under `/freal/`, never in the repo or
  Terraform state.

## Local development

```bash
uv sync
uv run pytest
```

Serve the API on localhost against live ESPN, with cookies from a file holding
`espn_s2=...` and `SWID=...` lines:

```bash
uv run python scripts/run_local.py <league id> <first year> <cookies file>
TOKEN=$(uv run python scripts/get_token.py)   # logs in to Lasso in a browser
curl -H "Authorization: Bearer $TOKEN" localhost:8000/leagues
```

## Frontend

`frontend/` is a Svelte 5 app built with Vite: a client-side app served as static files, with
the Lasso login done in the browser. Node comes from `frontend/.nvmrc`.

```bash
cd frontend
npm ci
npm run dev      # http://localhost:4321, the origin Lasso allows for login
npm run check    # svelte-check
npm test
```

Add `?demo` to any address to browse the anonymized sample season without logging in; PR
previews are always in demo mode, since they can't log in.

The frontend's API types (`frontend/src/lib/api/schema.d.ts`) and the demo data are generated
from the API, so they can't drift from it. After changing an API model, run
`scripts/check_contract.sh` and commit what it regenerates; CI fails if they differ.

## Deploying

Merging to `main` deploys: stych's Terraform workflow builds `dist/freal.zip`
(`scripts/build_lambda.sh`) and applies `infra/` as `freal-ci-apply`. Every PR
gets the plan as a comment.

The API is served at `https://freal-api.bylukehurst.com/`. After the first apply,
add a DNS-only `CNAME freal-api` in Cloudflare pointing at the `cname_target` output.

## Operating

Grant people access from the Lasso repo:

```bash
npx tsx scripts/bootstrap/add-user.ts --grant-role freal:read --email <email>
npx tsx scripts/bootstrap/add-user.ts --grant-role freal:connect --email <email>   # may refresh cookies
```

Add or change leagues (no deploy needed). `account` names the cookie set the
league uses and may contain lowercase letters, digits and dashes:

```bash
aws ssm put-parameter --name /freal/leagues --type String --overwrite --value \
  '[{"league_id": <league id>, "name": "<display name>", "account": "<account>", "first_year": <year>}]'
```

When ESPN expires the cookies, the API answers `502 espn_auth_expired`. Anyone with
`freal:connect` can store fresh ones with `POST /connect` (body `account`, `espn_s2`,
`swid`), or from a file:

```bash
aws ssm put-parameter --name /freal/espn/<account> --type SecureString --overwrite \
  --value file://cookies.json   # {"espn_s2": "...", "swid": "{...}"}
```

Delete the cookie file afterwards: the cookies are a login session for the ESPN account.
