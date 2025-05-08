import logging
from typing import Any, Dict, Set

from ...dbconnector import DBConnector
from ..api_extension import InvalidTableName

logger = logging.getLogger(__name__)


class SchemaManager:
    _core_columns_cache: Dict[str, Set[str]] = {}

    @staticmethod
    def get_column_info(
        dbc: DBConnector,
        table_name: str,
    ) -> list[dict[str, Any]]:

        query = """
        SELECT
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            CASE
                WHEN pk.constraint_type = 'PRIMARY KEY' THEN true
                ELSE false
            END AS is_primary_key,
            CASE
                WHEN fk.constraint_name IS NOT NULL THEN true
                ELSE false
            END AS is_foreign_key,
            fk.foreign_table_name,
            fk.foreign_column_name
        FROM
            information_schema.columns c
        LEFT JOIN (
            SELECT ku.table_name, ku.column_name, tc.constraint_type
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku
                ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
        LEFT JOIN (
            SELECT
                kcu.table_name,
                kcu.column_name,
                kcu.constraint_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM
                information_schema.key_column_usage kcu
            JOIN information_schema.referential_constraints rc
                ON kcu.constraint_name = rc.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON rc.unique_constraint_name = ccu.constraint_name
        ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
        WHERE
            c.table_name = %s
        ORDER BY
            c.ordinal_position;
        """

        result = dbc.execute_query(query, placeholders=[table_name], awaits_result=True)

        if result is None:
            logger.error(f"Table '{table_name}' not found in the database.")
            raise InvalidTableName(f"Table '{table_name}' not found in the database.")

        core_columns = SchemaManager.get_core_columns(table_name)

        for column in result:
            column["is_core"] = (
                column["column_name"] in core_columns if core_columns else False
            )

        return result

    @staticmethod
    def get_table_schema(dbc: DBConnector, table_name: str) -> dict[str, str]:
        logger.info(f"Fetching schema for table: {table_name}")
        query = """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = %s
        """
        tuplerows = dbc.execute_query(
            query=query, placeholders=[table_name], awaits_result=True
        )

        if tuplerows is None:
            logger.error(f"Invalid table name: {table_name}")
            raise InvalidTableName()
        schema = {column["column_name"]: column["data_type"] for column in tuplerows}
        logger.info(f"Schema fetched successfully for {table_name}")
        return schema

    @staticmethod
    def get_core_columns(table_name: str) -> Set[str]:
        if table_name in SchemaManager._core_columns_cache:
            return SchemaManager._core_columns_cache[table_name]

        return set()

    @staticmethod
    def is_core_column(table_name: str, column_name: str) -> bool:
        return column_name in SchemaManager.get_core_columns(table_name)

    @staticmethod
    def capture_core_columns_after_creation(dbc: DBConnector, table_name: str) -> None:
        logger.info(f"Capturing core columns for table: {table_name}")

        query = """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = %s
        """

        result = dbc.execute_query(query, placeholders=[table_name], awaits_result=True)

        if result:
            columns = {row["column_name"] for row in result}
            SchemaManager._core_columns_cache[table_name] = columns
            logger.info(f"Captured {len(columns)} core columns for {table_name}")
        else:
            logger.warning(f"No columns found for {table_name}")
            SchemaManager._core_columns_cache[table_name] = set()
