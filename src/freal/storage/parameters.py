from typing import TYPE_CHECKING, Protocol

import boto3

if TYPE_CHECKING:
    from mypy_boto3_ssm.client import SSMClient


class ParameterStore(Protocol):
    def get(self, name: str) -> str | None: ...

    def put_secret(self, name: str, value: str) -> None: ...


class SsmParameterStore:
    def __init__(self, client: "SSMClient | None" = None) -> None:
        self._client: SSMClient = client or boto3.client("ssm")

    def get(self, name: str) -> str | None:
        try:
            response = self._client.get_parameter(Name=name, WithDecryption=True)
        except self._client.exceptions.ParameterNotFound:
            return None
        return response["Parameter"].get("Value")

    def put_secret(self, name: str, value: str) -> None:
        self._client.put_parameter(Name=name, Value=value, Type="SecureString", Overwrite=True)


class MemoryParameterStore:
    def __init__(self, values: dict[str, str] | None = None) -> None:
        self._values = dict(values or {})

    def get(self, name: str) -> str | None:
        return self._values.get(name)

    def put_secret(self, name: str, value: str) -> None:
        self._values[name] = value
