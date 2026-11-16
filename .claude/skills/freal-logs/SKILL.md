---
name: freal-logs
description: Pull and read the freal API's CloudWatch logs. Use when asked who is using freal, what routes or tabs get hit, how slow the API is, whether ESPN cookies expired, or what an error was.
---

# freal logs

The API (Lambda `lj-freal-api`) writes JSON logs to CloudWatch. Retention is 30 days.

## Setup

- Region `us-east-1`, profile `freal-deploy` (the scoped stych permission set; it can read this log group and run Logs Insights, nothing broader), log group `/aws/lambda/lj-freal-api` (the `lj-` prefix matters; `/aws/lambda/freal*` finds nothing).
- Check access first: `AWS_PROFILE=freal-deploy aws sts get-caller-identity`. On `NoCredentials` or an expired token, ask the user to run `! aws sso login --profile freal-deploy`, since login opens a browser.

## What a request line looks like

One line per request, `message == "request"`, logger `freal.operations.api`:

```json
{"level": "INFO", "message": "request", "requestId": "…", "method": "GET",
 "route": "/leagues/{league_id}/seasons/{year}", "status": 200,
 "duration_ms": 5435, "subject": "b3698a6c-…"}
```

- `subject` is the Lasso token `sub`, an opaque UUID, never an email. It is omitted when the request had no valid token. Map a UUID to a person only by asking the user.
- `route` is the template, so league ids are not in the logs. `unmatched` is mostly CORS preflights (status 200, ~0 ms).
- Level is WARNING for 5xx and ERROR for unhandled exceptions (status 500, `internal_error`, traceback attached). `502 espn_auth_expired` means the ESPN cookies need refreshing via `POST /connect`.
- The cause of a mapped 502 (the ESPN error message) is not logged; only the status is.
- Other lines to ignore when counting: `mangum.http` (`GET /x 200`, duplicates the request line) and the `platform.*` start/report events.
- Cookie updates log `espn cookies updated for <account> by <subject>` from `freal.operations.service`; rejected tokens log `token rejected: <ErrorType>`.

## Queries

Logs Insights is asynchronous: start the query, wait a few seconds, then fetch the results.

```bash
export AWS_PROFILE=freal-deploy AWS_REGION=us-east-1
q=$(aws logs start-query --log-group-name /aws/lambda/lj-freal-api \
  --start-time $(( $(date +%s) - 86400 )) --end-time $(date +%s) \
  --query-string '<QUERY>' --query queryId --output text)
sleep 3; aws logs get-query-results --query-id "$q" --query 'results[*][*].value' --output text
```

Swap the time window to match the question (`86400` is 24 h; the maximum is 30 days). Rows omit empty fields, so columns can shift when `subject` is missing; use `--output json` when the shape matters.

| Question | `<QUERY>` |
|---|---|
| Who uses what | `filter message = "request" \| stats count() as n by subject, route \| sort n desc` |
| Activity per day | `filter message = "request" and ispresent(subject) \| stats count() by bin(1d), subject` |
| Slow routes | `filter message = "request" \| stats avg(duration_ms) as avg_ms, max(duration_ms) as max_ms, count() as n by route \| sort avg_ms desc` |
| Errors and ESPN failures | `filter message = "request" and status >= 500 \| fields @timestamp, route, status, subject, level \| sort @timestamp desc` |
| Rejected tokens | `filter message like /token rejected/ \| stats count() by bin(1d)` |

For a quick look at recent raw events instead of an aggregate:

```bash
aws logs filter-log-events --log-group-name /aws/lambda/lj-freal-api \
  --start-time $(( ($(date +%s) - 1800) * 1000 )) --filter-pattern '"request"' \
  --query 'events[].message' --output text
```

For a traceback, take the `requestId` from the ERROR request line and filter the group on that id.

## Reporting

Lead with the answer (who, how many, how slow), then the table. Say when the window is empty or when a result is only the user's own traffic.
