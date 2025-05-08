import logging

from ..api_extension import APIExtension
from ...utils import TransactionStrategy
from .utils import OverwriteStrategy
from .controller import PostgreSQLController

logger = logging.getLogger(__name__)


class PostgreSQLAPIController(PostgreSQLController, APIExtension):
    def __init__(
        self,
        user: str,
        password: str,
        host: str,
        port: str,
        transaction_strategy: TransactionStrategy = TransactionStrategy.PER_TABLE,
        overwrite_strategy: OverwriteStrategy = OverwriteStrategy.PRESERVE,
    ) -> None:
        logger.info("Initializing PostgreSQLAPIController")
        PostgreSQLController.__init__(
            self,
            user=user,
            password=password,
            host=host,
            port=port,
            transaction_strategy=transaction_strategy,
            overwrite_strategy=overwrite_strategy,
        )
        APIExtension.__init__(self)
        logger.info("PostgreSQLAPIController initialized successfully")
