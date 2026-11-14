import logging
from typing import Any, Protocol

import jwt

from freal.leagues.models import FrozenModel

logger = logging.getLogger(__name__)

TOKEN_LEEWAY_SECONDS = 60


class VerifiedToken(FrozenModel):
    subject: str | None
    scopes: tuple[str, ...]


class SigningKey(Protocol):
    key: Any


class SigningKeySource(Protocol):
    def get_signing_key_from_jwt(self, token: str) -> SigningKey: ...


class LassoTokenValidator:
    def __init__(
        self,
        *,
        issuer_url: str,
        audience: str,
        signing_keys: SigningKeySource | None = None,
    ) -> None:
        self._issuer_url = issuer_url
        self._audience = audience
        self._signing_keys: SigningKeySource = signing_keys or jwt.PyJWKClient(
            f"{issuer_url.rstrip('/')}/jwks"
        )

    def validate(self, token: str) -> VerifiedToken | None:
        """The verified token, or None when the signature, issuer, audience or expiry is wrong."""
        try:
            signing_key = self._signing_keys.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self._issuer_url,
                audience=self._audience,
                leeway=TOKEN_LEEWAY_SECONDS,
                options={"require": ["exp", "iss", "aud"]},
            )
        except jwt.PyJWTError as error:
            logger.warning("token rejected: %s", type(error).__name__)
            return None
        return VerifiedToken(
            subject=claims.get("sub"),
            scopes=tuple(str(claims.get("scope", "")).split()),
        )
