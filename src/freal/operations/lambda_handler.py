import os

from mangum import Mangum

from freal.operations.api import create_app
from freal.operations.auth import LassoTokenValidator
from freal.storage.parameters import SsmParameterStore

validator = LassoTokenValidator(
    issuer_url=os.environ["LASSO_ISSUER_URL"],
    audience=os.environ["FREAL_RESOURCE_URL"],
)

handler = Mangum(create_app(SsmParameterStore(), validator.validate), lifespan="off")
