from typing import TYPE_CHECKING

import boto3
from botocore.stub import Stubber

from freal.integrations.espn.credentials import EspnCredentials
from freal.storage.credentials import CredentialStore
from freal.storage.parameters import MemoryParameterStore, SsmParameterStore

if TYPE_CHECKING:
    from mypy_boto3_ssm.client import SSMClient


def test_a_missing_ssm_parameter_reads_as_none() -> None:
    client = _ssm_client()
    with Stubber(client) as stubber:
        stubber.add_client_error(
            "get_parameter",
            service_error_code="ParameterNotFound",
            expected_params={"Name": "/freal/x", "WithDecryption": True},
        )

        assert SsmParameterStore(client).get("/freal/x") is None


def test_an_ssm_parameter_is_read_decrypted() -> None:
    client = _ssm_client()
    with Stubber(client) as stubber:
        stubber.add_response(
            "get_parameter",
            {"Parameter": {"Name": "/freal/x", "Value": "hello"}},
            expected_params={"Name": "/freal/x", "WithDecryption": True},
        )

        assert SsmParameterStore(client).get("/freal/x") == "hello"


def test_secrets_are_written_encrypted_and_overwrite_the_old_value() -> None:
    client = _ssm_client()
    with Stubber(client) as stubber:
        stubber.add_response(
            "put_parameter",
            {"Version": 2},
            expected_params={
                "Name": "/freal/x",
                "Value": "v",
                "Type": "SecureString",
                "Overwrite": True,
            },
        )

        SsmParameterStore(client).put_secret("/freal/x", "v")

        stubber.assert_no_pending_responses()


def test_credentials_round_trip_through_a_store() -> None:
    parameters = MemoryParameterStore()
    store = CredentialStore(parameters)
    credentials = EspnCredentials.model_validate({"espn_s2": "a", "swid": "{b}"})

    store.save("luke", credentials)

    loaded = store.load("luke")
    assert loaded is not None
    assert loaded.espn_s2.get_secret_value() == "a"
    assert parameters.get("/freal/espn/luke") == '{"espn_s2": "a", "swid": "{b}"}'
    assert store.load("someone-else") is None


def _ssm_client() -> "SSMClient":
    return boto3.client(
        "ssm",
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )
