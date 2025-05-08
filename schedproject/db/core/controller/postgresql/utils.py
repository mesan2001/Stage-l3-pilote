import logging
from enum import Enum

logger = logging.getLogger(__name__)


class OverwriteStrategy(Enum):
    OVERWRITE = "overwrite"
    PRESERVE = "preserve"


class UtilsPotsgreSQLController:
    @staticmethod
    def transaction_table_query(
        transaction_table_name: str, drop_if_exists: bool = False
    ) -> str:
        query = ""
        if drop_if_exists:
            query += f"""
            DROP TABLE IF EXISTS {transaction_table_name} CASCADE;
            """
        query += f"""
            CREATE TABLE {transaction_table_name} (
                id SERIAL PRIMARY KEY,
                target_table VARCHAR(50),
                target_column VARCHAR(50),
                target_id INTEGER,
                new_value VARCHAR(255),
                action VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
        return query


class CSVActionType(Enum):
    RENAME = "RENAME"
    NEW = "NEW"
    DELETE = "DELETE"
