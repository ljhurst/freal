import time
from types import SimpleNamespace
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from freal.integrations.lasso.tokens import LassoTokenValidator

ISSUER = "https://lasso.example/"
AUDIENCE = "https://freal-api.example/"


class FakeSigningKeys:
    def __init__(self, public_key: Any, error: Exception | None = None) -> None:
        self._public_key = public_key
        self._error = error

    def get_signing_key_from_jwt(self, token: str) -> Any:
        if self._error is not None:
            raise self._error
        return SimpleNamespace(key=self._public_key)


@pytest.fixture(scope="module")
def private_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture
def validator(private_key: rsa.RSAPrivateKey) -> LassoTokenValidator:
    return LassoTokenValidator(
        issuer_url=ISSUER,
        audience=AUDIENCE,
        signing_keys=FakeSigningKeys(private_key.public_key()),
    )


def test_a_valid_token_yields_its_subject_and_scopes(
    validator: LassoTokenValidator, private_key: rsa.RSAPrivateKey
) -> None:
    verified = validator.validate(_token(private_key))

    assert verified is not None
    assert verified.subject == "user-1"
    assert verified.scopes == ("freal:read", "freal:connect")


def test_a_token_without_a_scope_claim_has_no_scopes(
    validator: LassoTokenValidator, private_key: rsa.RSAPrivateKey
) -> None:
    verified = validator.validate(_token(private_key, scope=None))

    assert verified is not None
    assert verified.scopes == ()


@pytest.mark.parametrize(
    "claims",
    [
        {"aud": "https://other-api.example/"},
        {"iss": "https://evil.example/"},
        {"exp": int(time.time()) - 3600},
    ],
    ids=["wrong audience", "wrong issuer", "expired"],
)
def test_tokens_with_the_wrong_audience_issuer_or_expiry_are_rejected(
    validator: LassoTokenValidator, private_key: rsa.RSAPrivateKey, claims: dict[str, Any]
) -> None:
    assert validator.validate(_token(private_key, **claims)) is None


def test_a_token_that_expired_moments_ago_is_still_accepted(
    validator: LassoTokenValidator, private_key: rsa.RSAPrivateKey
) -> None:
    assert validator.validate(_token(private_key, exp=int(time.time()) - 30)) is not None


def test_a_token_without_an_expiry_is_rejected(
    validator: LassoTokenValidator, private_key: rsa.RSAPrivateKey
) -> None:
    claims = _claims()
    del claims["exp"]

    assert validator.validate(jwt.encode(claims, private_key, algorithm="RS256")) is None


def test_a_token_signed_with_another_key_is_rejected(validator: LassoTokenValidator) -> None:
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    assert validator.validate(_token(other)) is None


def test_an_unsigned_token_is_rejected(validator: LassoTokenValidator) -> None:
    unsigned = jwt.encode(_claims(), "", algorithm="none")

    assert validator.validate(unsigned) is None


def test_garbage_is_rejected(validator: LassoTokenValidator) -> None:
    assert validator.validate("not-a-token") is None


def test_a_token_is_rejected_when_the_signing_keys_cannot_be_fetched(
    private_key: rsa.RSAPrivateKey,
) -> None:
    validator = LassoTokenValidator(
        issuer_url=ISSUER,
        audience=AUDIENCE,
        signing_keys=FakeSigningKeys(None, error=jwt.PyJWKClientConnectionError("down")),
    )

    assert validator.validate(_token(private_key)) is None


def _claims(**overrides: Any) -> dict[str, Any]:
    claims: dict[str, Any] = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "sub": "user-1",
        "scope": "freal:read freal:connect",
        "exp": int(time.time()) + 300,
    }
    claims.update(overrides)
    return {key: value for key, value in claims.items() if value is not None}


def _token(private_key: rsa.RSAPrivateKey, **overrides: Any) -> str:
    return jwt.encode(_claims(**overrides), private_key, algorithm="RS256")
