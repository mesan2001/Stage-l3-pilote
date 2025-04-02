import logging
from typing import List, Any

from ...utils import TransactionStrategy
from .utils import UtilsPotsgreSQLController

logger = logging.getLogger(__name__)


class TransactionManager:
    @staticmethod
    def create_transaction_table(
        dbc: Any,
        table_name: str,
        transaction_table_name: str,
        transaction_strategy: TransactionStrategy,
        transaction_tables: List[str],
    ) -> None:
        if transaction_strategy == TransactionStrategy.PER_TABLE:
            transaction_table = TransactionManager.get_transaction_table_name(
                table_name, transaction_table_name, transaction_strategy
            )
            if transaction_table not in dbc.tables("warehouse"):
                dbc.dbc_warehouse.execute_query(
                    UtilsPotsgreSQLController.transaction_table_query(transaction_table)
                )
            if transaction_table not in transaction_tables:
                transaction_tables.append(transaction_table)

    @staticmethod
    def get_transaction_table_name(
        table_name: str,
        default_transaction_table: str,
        transaction_strategy: TransactionStrategy,
    ) -> str:
        if transaction_strategy == TransactionStrategy.SINGLE_TABLE:
            return default_transaction_table
        elif transaction_strategy == TransactionStrategy.PER_TABLE:
            return f"{table_name}_{default_transaction_table}"
        raise NotImplementedError(
            f"{transaction_strategy} is not implemented for table name generation"
        )

    @staticmethod
    def create_associated_view_name(table: str) -> str:
        return f"view_{table}"
