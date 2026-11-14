from pydantic import BaseModel, SecretStr


class EspnCredentials(BaseModel):
    espn_s2: SecretStr
    swid: SecretStr
