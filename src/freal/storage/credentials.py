import json

from freal.integrations.espn.credentials import EspnCredentials
from freal.storage.parameters import ParameterStore


class CredentialStore:
    def __init__(self, parameters: ParameterStore) -> None:
        self._parameters = parameters

    def load(self, account: str) -> EspnCredentials | None:
        raw = self._parameters.get(_parameter_name(account))
        return EspnCredentials.model_validate_json(raw) if raw else None

    def save(self, account: str, credentials: EspnCredentials) -> None:
        payload = {
            "espn_s2": credentials.espn_s2.get_secret_value(),
            "swid": credentials.swid.get_secret_value(),
        }
        self._parameters.put_secret(_parameter_name(account), json.dumps(payload))


def _parameter_name(account: str) -> str:
    return f"/freal/espn/{account}"
