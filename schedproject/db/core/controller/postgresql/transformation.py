import logging
from typing import Any

from ...utils import TransactionStrategy
from ...databridging import (
    StageConfiguration,
    WarehouseCore,
)
from .schema_management import SchemaManager

logger = logging.getLogger(__name__)


class TransformationManager:
    @staticmethod
    def verify_staging_results(
        configs: list[StageConfiguration],
        controller: Any,
    ) -> list[str]:
        logger.info("Verifying staging results")
        ret = []
        for config in configs:
            for expression in config.datamarts:
                from_view, to_view = StageConfiguration.get_from_view_and_to_view(
                    expression
                )
                if not controller.table_or_view_exists(
                    to_view, "warehouse"
                ) or not controller.check_table_content(to_view):
                    logger.error(
                        f"Inconsistency found for {to_view}: Missing or empty in warehouse."
                    )
                    ret.append(to_view)

        logger.info("Verification of staging results completed.")
        return ret

    @staticmethod
    def copy_staging_result_to_warehouse(
        controller: Any, config: StageConfiguration
    ) -> None:
        logger.info(f"Copying staging result to warehouse for config: {config}")

        association_from_view_to_view = {}

        for expression in config.datamarts:
            from_view, to_view = StageConfiguration.get_from_view_and_to_view(
                expression
            )
            association_from_view_to_view[from_view] = to_view

            new_schema = SchemaManager.get_table_schema(controller.dbc_raw, from_view)

            target_exists = controller.table_or_view_exists(to_view, "warehouse")

            column_info = SchemaManager.get_column_info(controller.dbc_raw, from_view)
            primary_key_column = next(
                (col for col in column_info if col["is_primary_key"]), None
            )

            if primary_key_column:
                primary_key_name = primary_key_column["column_name"]
            else:
                primary_key_name = "id"

            t1_typed = ", ".join(
                [f"{col_name} {new_schema[col_name]}" for col_name in new_schema.keys()]
            )

            t1 = ", ".join([f"{col_name}" for col_name in new_schema.keys()])

            if not target_exists:
                query = f"""
                    CREATE EXTENSION IF NOT EXISTS dblink;

                    CREATE TABLE {to_view} AS
                    SELECT *
                    FROM dblink('dbname={controller.dbc_raw.database}
                                user={controller.dbc_raw.user}
                                password={controller.dbc_raw.password}',
                                    'SELECT {t1} FROM {from_view}')
                                AS t1({t1_typed});
                """

                if primary_key_column:
                    query += f"""
                    ALTER TABLE {to_view} ALTER COLUMN {primary_key_name} SET NOT NULL;
                    ALTER TABLE {to_view} ADD PRIMARY KEY ({primary_key_name});
                    """
                else:
                    query += f"ALTER TABLE {to_view} ADD COLUMN id SERIAL PRIMARY KEY;"

                foreign_key_statements = []
                for col in column_info:
                    if col["is_foreign_key"]:
                        foreign_key_statements.append(
                            f"""
                            ALTER TABLE {to_view} ADD CONSTRAINT fk_{col['column_name']}
                            FOREIGN KEY ({col['column_name']})
                            REFERENCES {association_from_view_to_view[col['foreign_table_name']]}({col['foreign_column_name']});
                            """
                        )
                query += "".join(foreign_key_statements)

                logger.info(f"Creating new table: {to_view}")
                controller.dbc_warehouse.execute_query(query=query.strip())
            else:
                existing_schema = SchemaManager.get_table_schema(
                    controller.dbc_warehouse, to_view
                )

                protected_columns = WarehouseCore.get_protected_columns(to_view)
                columns_to_add = {}
                for col_name, col_type in new_schema.items():
                    if (
                        col_name not in existing_schema
                        and col_name not in protected_columns
                    ):
                        columns_to_add[col_name] = col_type

                for col_name, col_type in columns_to_add.items():
                    alter_sql = (
                        f"ALTER TABLE {to_view} ADD COLUMN {col_name} {col_type};"
                    )
                    logger.info(f"Adding column {col_name} to {to_view}")
                    controller.dbc_warehouse.execute_query(alter_sql)
                    existing_schema[col_name] = col_type

                if columns_to_add:
                    logger.info(
                        f"Extended schema for {to_view} with {len(columns_to_add)} new columns"
                    )

                temp_table = f"temp_{to_view}"
                temp_query = f"""
                    CREATE EXTENSION IF NOT EXISTS dblink;

                    DROP TABLE IF EXISTS {temp_table} CASCADE;

                    CREATE TEMPORARY TABLE {temp_table} AS
                    SELECT *
                    FROM dblink('dbname={controller.dbc_raw.database}
                                user={controller.dbc_raw.user}
                                password={controller.dbc_raw.password}',
                                    'SELECT {t1} FROM {from_view}')
                                AS t1({t1_typed});
                """
                logger.info(f"Creating temporary table for data: {temp_table}")
                controller.dbc_warehouse.execute_query(query=temp_query.strip())

                if primary_key_column:
                    columns_to_update = [
                        col for col in new_schema.keys() if col != primary_key_name
                    ]

                    if columns_to_update:
                        update_statements = ", ".join(
                            [f"{col} = EXCLUDED.{col}" for col in columns_to_update]
                        )

                        merge_query = f"""
                            INSERT INTO {to_view} ({', '.join(new_schema.keys())})
                            SELECT {', '.join(new_schema.keys())}
                            FROM {temp_table}
                            ON CONFLICT ({primary_key_name})
                            DO UPDATE SET {update_statements};
                        """
                        logger.info(f"Merging data into {to_view} with upsert")
                        controller.dbc_warehouse.execute_query(merge_query)
                    else:
                        logger.info(f"No columns to update for {to_view}")
                else:
                    insert_query = f"""
                        INSERT INTO {to_view} ({', '.join(new_schema.keys())})
                        SELECT {', '.join(new_schema.keys())}
                        FROM {temp_table};
                    """
                    logger.info(f"Inserting data into {to_view}")
                    controller.dbc_warehouse.execute_query(insert_query)

                controller.dbc_warehouse.execute_query(
                    f"DROP TABLE IF EXISTS {temp_table};"
                )

            if controller.transaction_strategy == TransactionStrategy.PER_TABLE:
                controller.create_transaction_table(to_view)

            transaction_table = controller.get_transaction_table_name(to_view)

            left_joins = ""
            coalesces = []
            for col_name in new_schema.keys():
                if col_name != primary_key_name:
                    left_joins += f"""
                        LEFT JOIN filtered_transactions ft_{col_name} ON r.{primary_key_name}::text = ft_{col_name}.target_id::text
                            AND ft_{col_name}.target_column = '{col_name}'
                            AND ft_{col_name}.action != 'delete'
                        """

                    col_type = ""
                    if new_schema[col_name].upper() != "TEXT":
                        col_type = f"::{new_schema[col_name].upper()}"

                    coalesces.append(
                        f"COALESCE(ft_{col_name}.new_value{col_type}, r.{col_name}) AS {col_name}"
                    )

            coalesces_str = ",\n".join(coalesces)

            associated_view_name = controller.create_associated_view_name(to_view)

            query = f"""
                DROP VIEW IF EXISTS {associated_view_name} CASCADE;
                CREATE VIEW {associated_view_name} AS
                WITH latest_transactions AS (
                    SELECT
                        target_table,
                        target_column,
                        target_id,
                        new_value,
                        action,
                        ROW_NUMBER() OVER (PARTITION BY target_table,
                            target_id,
                            target_column ORDER BY created_at DESC,
                            id DESC) AS rn
                    FROM {transaction_table}
                    WHERE UPPER(target_table) = UPPER('{to_view}')
                ),
                filtered_transactions AS (
                    SELECT
                        target_table,
                        target_column,
                        target_id,
                        new_value,
                        action
                    FROM latest_transactions
                    WHERE rn = 1
                ),
                modified_table AS (
                    SELECT
                        r.{primary_key_name},
                        {coalesces_str}
                    FROM
                        {to_view} r
                        {left_joins}
                        WHERE
                            NOT EXISTS (
                                SELECT 1 FROM filtered_transactions ft_delete
                                WHERE r.{primary_key_name}::text = ft_delete.target_id::text
                                        AND ft_delete.action = 'delete'
                            )
                )

                SELECT * FROM modified_table;
            """
            logger.info(f"Executing query to create view: {associated_view_name}")
            controller.dbc_warehouse.execute_query(query=query)
            controller.vt_association[f"{associated_view_name}"] = to_view

        logger.info("Finished copying staging result to warehouse")

    @staticmethod
    def initialize_warehouse_core(controller: Any) -> None:
        logger.info("Initializing warehouse core tables")

        core_tables = WarehouseCore.get_core_tables_in_order()

        if not core_tables:
            logger.warning("No core tables found")
            return

        for table_config in core_tables:
            logger.info(f"Creating core table: {table_config.name}")
            sql = WarehouseCore.get_sql_for_table(table_config.name)

            if not sql:
                logger.error(f"SQL definition missing for {table_config.name}")
                raise Exception(f"Cannot find SQL definition for {table_config.name} ")

            try:
                controller.dbc_warehouse.execute_query(sql)
                SchemaManager.capture_core_columns_after_creation(
                    controller.dbc_warehouse, table_config.name
                )
                logger.info(f"Core table {table_config.name} created successfully")
            except Exception as e:
                logger.error(f"Error creating core table {table_config.name}: {str(e)}")
                raise

        logger.info("Warehouse core tables initialized successfully")
