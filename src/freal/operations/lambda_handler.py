import logging
import os

from mangum import Mangum

from freal.integrations.lasso.tokens import LassoTokenValidator
from freal.operations.api import create_app
from freal.operations.service import LeagueService
from freal.storage.parameters import SsmParameterStore

logging.getLogger("freal").setLevel(logging.INFO)

validator = LassoTokenValidator(
    issuer_url=os.environ["LASSO_ISSUER_URL"],
    audience=os.environ["FREAL_RESOURCE_URL"],
)

service = LeagueService(SsmParameterStore())

handler = Mangum(create_app(service, validator.validate), lifespan="off")
