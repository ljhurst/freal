"""Log in to Lasso the way the freal dashboard will and print an access token.

Usage: TOKEN=$(uv run python scripts/get_token.py)

A browser opens for the Lasso login. The token goes to stdout and progress to stderr,
so the command can be captured. Needs the freal client and your user's freal roles
deployed in Lasso, and port 4321 free.
"""

import base64
import hashlib
import secrets
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlparse

import httpx

ISSUER = "https://lasso.bylukehurst.com/"
RESOURCE = "https://freal-api.bylukehurst.com/"
CLIENT_ID = "freal"
PORT = 4321
REDIRECT_URI = f"http://localhost:{PORT}/auth/callback"
SCOPE = "openid freal:read freal:connect"


def main() -> None:
    metadata = httpx.get(f"{ISSUER}.well-known/openid-configuration").raise_for_status().json()
    verifier = secrets.token_urlsafe(64)
    state = secrets.token_urlsafe(16)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=")

    authorize_url = (
        metadata["authorization_endpoint"]
        + "?"
        + urlencode(
            {
                "response_type": "code",
                "client_id": CLIENT_ID,
                "redirect_uri": REDIRECT_URI,
                "scope": SCOPE,
                "state": state,
                "code_challenge": challenge.decode(),
                "code_challenge_method": "S256",
                "resource": RESOURCE,
            }
        )
    )
    print(f"Opening {authorize_url}", file=sys.stderr)
    webbrowser.open(authorize_url)

    query = _wait_for_callback()
    if query.get("state") != [state] or "code" not in query:
        sys.exit(f"login failed: {query.get('error_description') or query.get('error') or query}")

    response = httpx.post(
        metadata["token_endpoint"],
        data={
            "grant_type": "authorization_code",
            "code": query["code"][0],
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "code_verifier": verifier,
            "resource": RESOURCE,
        },
    )
    if response.is_error:
        sys.exit(f"token request failed: {response.status_code} {response.text}")
    tokens = response.json()
    print(f"granted scope: {tokens.get('scope')}", file=sys.stderr)
    print(tokens["access_token"])


def _wait_for_callback() -> dict[str, list[str]]:
    received: dict[str, list[str]] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            received.update(parse_qs(urlparse(self.path).query))
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Logged in. You can close this tab.")

        def log_message(self, format: str, *args: object) -> None:
            return

    with HTTPServer(("127.0.0.1", PORT), Handler) as server:
        server.handle_request()
    return received


if __name__ == "__main__":
    main()
