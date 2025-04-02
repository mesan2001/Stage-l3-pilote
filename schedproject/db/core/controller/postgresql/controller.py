import logging
import os
import re
from typing import Any, Optional, override

from psycopg.errors import DuplicateTable

from core.controller.api_extension import (
    InvalidTableName,
    NoJsonDataProvided,
    TableNotFoundError,
)
from core.controller.postgresql.csv_processing import CSVProcessor
from core.databridging.staging import StageConfigurationCycle


from ..abstract_controller import AbstractController
from ...dbconnector import DBConnector, PostgresqlDBConnector
from ...databridging import StageConfiguration
from ...utils import (
    InconsistentStructure,
    InvalidDatabaseName,
    MissingConfigurationField,
    MissingConfigurationSection,
    TransactionStrategy,
    WrongQueryType,
    compare_dictionaries,
    is_valid_table_name,
    read_csv,
)

from .utils import CSVActionType, OverwriteStrategy, UtilsPotsgreSQLController
from .schema_management import SchemaManager
from .transaction_management import TransactionManager
from .transformation import TransformationManager

logger = logging.getLogger(__name__)


class PostgreSQLController(AbstractController):
    drop_table_if_exists = False
    transaction_table_name: str = "transactions"
    staging_folder = StageConfiguration.DEFAULT_STAGING_PATH
    transformation_occured = False

    def __init__(
        self,
        user: str,
        password: str,
        host: str,
        port: str,
        transaction_strategy: TransactionStrategy = TransactionStrategy.SINGLE_TABLE,
        overwrite_strategy: OverwriteStrategy = OverwriteStrategy.PRESERVE,
        staging_folder: Optional[str] = None,
    ) -> None:
        logger.info("Initializing PostgreSQLController")
        self.transaction_strategy = transaction_strategy
        self.overwrite_strategy = overwrite_strategy

        if staging_folder:
            PostgreSQLController.staging_folder = staging_folder

        self.dbc_raw = PostgresqlDBConnector(
            user=user,
            password=password,
            host=host,
            port=port,
            database="raw",
        )

        self.dbc_warehouse = PostgresqlDBConnector(
            user=user,
            password=password,
            host=host,
            port=port,
            database="warehouse",
        )

        logger.info("Checking and initializing warehouse core tables...")
        TransformationManager.initialize_warehouse_core(self)

        self.tables_information = {}
        self.vt_association: dict[str, str] = {}
        self._tt: list[str] = []

        configs = StageConfiguration.get_all_configs_in_folder()
        missing_entry = TransformationManager.verify_staging_results(configs, self)

        if missing_entry:
            self.transformation_occured = False
        else:
            logging.info("Reproduce metadata informations...")
            self.transformation_occured = True
            for config in configs:
                for expression in config.datamarts:
                    from_view, to_view = StageConfiguration.get_from_view_and_to_view(
                        expression
                    )
                    associated_view_name = (
                        TransactionManager.create_associated_view_name(to_view)
                    )
                    if self.table_or_view_exists(associated_view_name, "warehouse"):
                        self.vt_association[associated_view_name] = to_view
                    if self.table_or_view_exists(to_view, "warehouse"):
                        self.tables_information[to_view] = (
                            SchemaManager.get_table_schema(self.dbc_raw, to_view)
                        )
            tables = self.tables("warehouse")
            for table in tables:
                if self.get_transaction_table_name(table) in tables:
                    if self.get_transaction_table_name(table) not in self._tt:
                        self._tt.append(self.get_transaction_table_name(table))

        if self.transaction_strategy == TransactionStrategy.SINGLE_TABLE:
            if self.transaction_table_name not in self.tables("warehouse"):
                self.dbc_warehouse.execute_query(
                    UtilsPotsgreSQLController.transaction_table_query(
                        self.transaction_table_name
                    )
                )

        logger.info("PostgreSQLController initialized successfully")

    def get_transaction_table_name(self, table_name: str) -> str:
        return TransactionManager.get_transaction_table_name(
            table_name, self.transaction_table_name, self.transaction_strategy
        )

    def create_associated_view_name(self, table: str) -> str:
        return TransactionManager.create_associated_view_name(table)

    def table_or_view_exists(self, name: str, database: str = "raw") -> bool:
        logger.info(f"Checking if table or view exists: {name} in {database}")
        query = """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND (table_type = 'BASE TABLE' OR table_type = 'VIEW')
                AND table_name = %s
            );
        """
        dbc = self.dbc_raw if database.lower() == "raw" else self.dbc_warehouse
        result = dbc.execute_query(query, placeholders=[name], awaits_result=True)
        exists = bool(result and result[0].get("exists", False))
        logger.info(f"Existence check for {name}: {exists}")
        return exists

    def check_table_content(self, table_name: str) -> bool:
        logger.info(f"Checking if table contains data: {table_name}")
        query = f"SELECT COUNT(*) as count FROM {table_name};"
        result = self.dbc_warehouse.execute_query(query, awaits_result=True)
        if result:
            count = int(result[0].get("count", 0))
        else:
            count = 0
        has_content = count > 0 if count is not None else False
        logger.info(f"Table {table_name} contains data: {has_content}")
        return has_content

    def get_transformation_occured(self) -> bool:
        return self.transformation_occured

    def create_transaction_table(self, table_name: str) -> None:
        TransactionManager.create_transaction_table(
            self,
            table_name,
            self.transaction_table_name,
            self.transaction_strategy,
            self._tt,
        )

    @staticmethod
    def from_conf_file(main_conf: dict[str, Any]) -> "PostgreSQLController":
        if "posgresql-controller" not in main_conf:
            logger.error("Missing `posgresql-controller` section in configuration file")
            raise MissingConfigurationSection("posgresql-controller")

        conf = main_conf["posgresql-controller"]

        required_fields = ["user", "password", "host", "port"]
        missing_fields = [field for field in required_fields if field not in conf]

        if missing_fields:
            logger.error(
                f"Missing configuration filed(s) {missing_fields} from the configuration section `posgresql-controller`"
            )
            raise MissingConfigurationField(missing_fields)

        if (k := "drop-table-if-exists") in conf:
            PostgreSQLController.drop_table_if_exists = conf[k]
        if (k := "transaction-table-name") in conf:
            PostgreSQLController.transaction_table_name = conf[k]

        staging_folder = None
        if (k := "staging-folder") in conf:
            staging_folder = conf[k]

        transaction_strategy = TransactionStrategy.SINGLE_TABLE
        if (k := "transaction-strategy") in conf:
            try:
                transaction_strategy = TransactionStrategy(conf[k])
            except ValueError:
                logger.warning(
                    f"Invalid transaction strategy {conf[k]}, using default single_table"
                )

        overwrite_strategy = OverwriteStrategy.PRESERVE
        if (k := "overwrite-strategy") in conf:
            try:
                overwrite_strategy = OverwriteStrategy(conf[k])
            except ValueError:
                logger.warning(
                    f"Invalid overwrite strategy {conf[k]}, using default preserve"
                )

        return PostgreSQLController(
            user=conf["user"],
            password=conf["password"],
            host=conf["host"],
            port=conf["port"],
            transaction_strategy=transaction_strategy,
            overwrite_strategy=overwrite_strategy,
            staging_folder=staging_folder,
        )

    @override
    def create_table(
        self,
        table_name: str,
        json_list: list[dict[str, Any]],
        primary_key: str | None = None,
    ) -> int:
        logger.info(f"Creating table: {table_name}")
        if not is_valid_table_name(table_name):
            logger.error(f"Invalid table name: {table_name}")
            raise InvalidTableName()

        if not json_list:
            logger.error("No JSON data provided")
            raise NoJsonDataProvided()

        try:
            data_types, json_list = PostgresqlDBConnector._analyse_json(json_list)
        except InconsistentStructure:
            logger.error("Inconsistent structure in JSON data")
            raise InconsistentStructure()

        if not primary_key:
            primary_key = ""

        columns = ", ".join(
            [
                (
                    f"{key} {data_types[key]}"
                    if primary_key != key
                    else f"{key} {data_types[key]} PRIMARY KEY"
                )
                for key in data_types
            ]
        )
        create_table_statement = f"CREATE TABLE {table_name} ({columns});"

        try:
            self.tables_information[table_name] = data_types
            self.dbc_raw.execute_query(create_table_statement)
            logger.info(f"Table {table_name} created successfully")
        except DuplicateTable as e:
            if self.drop_table_if_exists:
                logger.warning(f"Dropping existing table {table_name}")
                self.dbc_raw.execute_query(f"DROP TABLE IF EXISTS {table_name};")
                self.dbc_raw.execute_query(create_table_statement)
                self.tables_information[table_name] = data_types
                logger.info(f"Table {table_name} recreated successfully")
            else:
                logger.error(f"Table {table_name} already exists")
                raise e

        insert_statement = ""
        concat_values = []

        columns = f"({', '.join(data_types.keys())})"
        insert_statement += f"INSERT INTO {table_name} {columns} VALUES"
        for obj in json_list:
            values = [value for value in tuple(obj.values())]
            placeholders = ", ".join(["%s"] * len(values))
            insert_statement += f"({placeholders}),\n"
            concat_values.extend(values)

        insert_statement = insert_statement[: insert_statement.rindex(",")]
        insert_statement += ";"
        self.dbc_raw.execute_query(insert_statement, placeholders=concat_values)
        logger.info(f"Inserted {len(json_list)} rows into {table_name}")
        return len(json_list)

    @override
    def insert(self, table_name: str, json_data: dict | list[dict]) -> int:
        logger.info(f"Trying inserting data into table: {table_name}")
        if not is_valid_table_name(table_name):
            logger.error(f"Invalid table name: {table_name}")
            raise InvalidTableName()

        logger.info(
            f"Checking if table {table_name} exists: {self.dbc_raw.table_exists(table_name)}"
        )
        if not self.dbc_raw.table_exists(table_name):
            logger.error(f"Table not found: {table_name}")
            raise TableNotFoundError()

        if not json_data:
            logger.error("No JSON data provided")
            raise NoJsonDataProvided()

        if isinstance(json_data, list):
            json_list = json_data
        elif isinstance(json_data, dict):
            json_list = [json_data]
        else:
            logger.error("Inconsistent structure in JSON data")
            raise InconsistentStructure()

        data_types, json_list = self.dbc_raw._analyse_json(json_list)

        if data_types != self.tables_information[table_name]:
            comparison = compare_dictionaries(
                self.tables_information[table_name], data_types
            )
            logger.error(f"Inconsistent structure: {comparison}")
            raise InconsistentStructure(comparison)

        insert_statement = ""
        concat_values = []

        columns = f"({', '.join(data_types.keys())})"
        insert_statement += f"INSERT INTO {table_name} {columns} VALUES"
        for obj in json_list:
            values = [value for value in tuple(obj.values())]
            placeholders = ", ".join(["%s"] * len(values))
            insert_statement += f"({placeholders}),\n"
            concat_values.extend(values)

        insert_statement = insert_statement[: insert_statement.rindex(",")]
        insert_statement += ";"
        self.dbc_raw.execute_query(insert_statement, placeholders=concat_values)
        logger.info(f"Inserted {len(json_list)} rows into {table_name}")
        return len(json_list)

    @override
    def tables(self, database: str) -> list[str]:
        logger.info("Fetching list of tables")

        if database.lower() == "raw":
            dbc = self.dbc_raw
        elif database.lower() == "warehouse":
            dbc = self.dbc_warehouse
        else:
            logger.error(f"Invalid database name: {database}")
            raise InvalidDatabaseName("Database must be either 'raw' or 'warehouse'")
        tables = dbc.execute_query(
            """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE';
            """,
            awaits_result=True,
        )
        if isinstance(tables, list):
            table_list = [table["table_name"] for table in tables]
            logger.info(f"Found {len(table_list)} tables")
            return table_list

        logger.warning("No tables found")
        return []

    @override
    def views(self) -> list[str]:
        logger.info("Fetching list of views")
        views = self.dbc_raw.execute_query(
            """
                SELECT table_name
                FROM information_schema.views
                WHERE table_schema = 'public';
            """,
            awaits_result=True,
        )
        if isinstance(views, list):
            view_list = [table["table_name"] for table in views]
            logger.info(f"Found {len(view_list)} views")
            return view_list
        logger.warning("No views found")
        return []

    @override
    def transactions_tables(self):
        return self._tt

    def _get_tables_schema(self, table_name: str, dbc: DBConnector) -> dict[str, str]:
        return SchemaManager.get_table_schema(dbc, table_name)

    def _parse_header(
        self, paired_headers: list[tuple[str, str]]
    ) -> list[tuple[tuple[str, str], tuple[CSVActionType, str]]]:
        return CSVProcessor.parse_header(paired_headers)

    def _query_from_csv(self, file: str, filename: str, separator: str = ",") -> str:
        logger.info(f"Generating query from CSV file: {filename}")

        def _init_rec_regex_replace(
            regex_replace: list[tuple[str, str]],
            initial_table_name: str,
            initial_column_name: str,
            new_column_name: str,
        ) -> str:
            def _rec_regex_replace(
                idx: int,
                regex_replace: list[tuple[str, str]],
                initial_table_name: str,
                initial_column_name: str,
            ) -> str:
                if idx <= 0:
                    if len(regex_replace) == 0:
                        return f"{initial_table_name}.{initial_column_name}"

                regex = regex_replace[idx][0].replace("'", "''")
                replace = regex_replace[idx][1].replace("'", "''")

                regex = re.sub(r"\$(\d+)", r"\\\1", regex)
                replace = re.sub(r"\$(\d+)", r"\\\1", replace)

                if idx <= 0:
                    if len(regex_replace) == 0:
                        return f"{initial_table_name}.{initial_column_name}"

                    return f"REGEXP_REPLACE({initial_table_name}.{initial_column_name}, '{regex}','{replace}', 'g')"
                else:
                    return f"REGEXP_REPLACE({_rec_regex_replace(idx-1, regex_replace, initial_table_name,initial_column_name)}, '{regex}','{replace}', 'g')"

            return (
                _rec_regex_replace(
                    len(regex_replace) - 1,
                    regex_replace,
                    initial_table_name,
                    initial_column_name,
                )
                + f"::text AS {new_column_name}"
            )

        merged_by_initial_table: dict[
            str, dict[str, list[tuple[CSVActionType, str, list[tuple[str, str]]]]]
        ] = {}

        paired_headers, paired_columns = read_csv(file, separator)
        decomposed_paired_headers = self._parse_header(paired_headers)

        for p_head, p_col in zip(decomposed_paired_headers, paired_columns):
            if p_head[0][0] not in merged_by_initial_table:
                merged_by_initial_table[p_head[0][0]] = {}

            if p_head[0][1] not in merged_by_initial_table[p_head[0][0]]:
                merged_by_initial_table[p_head[0][0]][p_head[0][1]] = [
                    (
                        p_head[1][0],
                        p_head[1][1],
                        p_col,
                    )
                ]
            else:
                merged_by_initial_table[p_head[0][0]][p_head[0][1]].append(
                    (
                        p_head[1][0],
                        p_head[1][1],
                        p_col,
                    )
                )

        last_slash = (filename.rindex("/") if "/" in filename else 0) + 1
        last_dot = (
            filename.rindex(".") if "." in filename[last_slash:] else len(filename)
        )
        pretty_filename = filename[last_slash:last_dot]

        queries = []

        for initial_table in merged_by_initial_table.keys():
            if len(merged_by_initial_table.keys()) < 2:
                view_name = pretty_filename
            else:
                view_name = f"{initial_table}_{pretty_filename}"

            schema = self._get_tables_schema(dbc=self.dbc_raw, table_name=initial_table)
            column_to_keep = [col for col in schema.keys()]
            replacements = []
            for initial_column in merged_by_initial_table[initial_table].keys():
                for merged in merged_by_initial_table[initial_table][initial_column]:
                    action, new_col_name, regex_replaces = merged
                    if action != CSVActionType.DELETE:
                        replacements.append(
                            _init_rec_regex_replace(
                                regex_replaces,
                                initial_table,
                                initial_column,
                                new_col_name,
                            )
                        )
                    match action:
                        case CSVActionType.DELETE:
                            if initial_column in column_to_keep:
                                column_to_keep.remove(initial_column)

                        case CSVActionType.NEW:
                            pass

                        case CSVActionType.RENAME:
                            if initial_column in column_to_keep:
                                column_to_keep.remove(initial_column)
                        case _:
                            logger.error(f"Unhandled action type: {action}")
                            raise NotImplementedError()

            query = f"""
            DROP VIEW IF EXISTS {view_name} CASCADE;
            CREATE VIEW {view_name} AS
                SELECT
                {", \n".join(column_to_keep) + "," if column_to_keep else ""}
            """

            query += ",\n".join(replacements)
            query += f"\nFROM {initial_table}"
            queries.append(query)

        logger.info(f"Generated {len(queries)} queries from CSV file")
        return ";\n".join(queries) + ";"

    def _from_other_format(self, file: str, filename: str, dbc: DBConnector) -> str:
        return CSVProcessor.from_other_format(file, filename, dbc)

    @override
    def process_data_transformation(self, configs: list[StageConfiguration]) -> None:
        logger.info("Starting data transformation process")

        try:
            ordered_configs = StageConfiguration.compute_staging_order(
                configs, self.tables("raw")
            )
            logger.info("Found staging order for configurations by execution behavior")
        except StageConfigurationCycle as e:
            logger.error("Detected cycle in stage configuration")
            raise e

        for config in ordered_configs:
            for file in config.staging_files:
                logger.info(f"Processing file: {file}")
                real_path = os.path.join(
                    os.getcwd(), self.staging_folder, config.workdir, file
                ).strip()
                with open(real_path, mode="r", newline="", encoding="utf-8") as f:
                    stage = f.read()

                if real_path.endswith(".sql"):
                    logger.info("Executing SQL file")
                    query = stage
                else:
                    logger.info("Converting file to SQL query")
                    query = self._from_other_format(stage, real_path, self.dbc_raw)
                logger.info(query)
                self.dbc_raw.execute_query(query=query)
                logger.info(f"Executed query for file: {file}")

            logger.info(f"Copying staging result to warehouse for config: {config}")
            TransformationManager.copy_staging_result_to_warehouse(self, config)

        TransformationManager.verify_staging_results(configs, self)

        self.transformation_occured = True
        logger.info("Data transformation process completed")

    def get_column_info(
        self, table_name: str, database: str = "raw"
    ) -> list[dict[str, Any]]:
        if database.lower() == "raw":
            dbc = self.dbc_raw
        elif database.lower() == "warehouse":
            dbc = self.dbc_warehouse
        else:
            logger.error(f"Invalid database name: {database}")
            raise InvalidDatabaseName("Database must be either 'raw' or 'warehouse'")

        return SchemaManager.get_column_info(dbc, table_name)

    def copy_staging_result_to_warehouse(self, config: StageConfiguration) -> None:
        TransformationManager.copy_staging_result_to_warehouse(self, config)

    @override
    def query(
        self,
        database: str,
        query: str,
        placeholders: list[Any] | None = None,
        awaits_result: bool = True,
    ) -> list[dict[str, Any]]:
        logger.info(f"Executing query on database: {database}")
        if database.lower() not in ["raw", "warehouse"]:
            logger.error(f"Invalid database name: {database}")
            raise InvalidDatabaseName("Database must be either 'raw' or 'warehouse'")

        dbc = self.dbc_raw if database.lower() == "raw" else self.dbc_warehouse

        result = dbc.execute_query(
            query, placeholders=placeholders, awaits_result=awaits_result
        )

        if awaits_result:
            if isinstance(result, list):
                return result
            raise WrongQueryType(
                f"Query should return list when awaits_result=True, got {type(result)}"
            )
        else:
            if result is None:
                logger.info("Non-result query executed successfully")
                return []
            logger.error(f"Non-result query returned unexpected data: {result}")
            raise WrongQueryType(
                f"Query should return None when awaits_result=False, got {type(result)}"
            )

    @override
    def view_table_association(self) -> dict[str, str]:
        return self.vt_association

    def verify_staging_results(self, configs: list[StageConfiguration]) -> list[str]:
        return TransformationManager.verify_staging_results(configs, self)

    def initialize_warehouse_core(self):
        TransformationManager.initialize_warehouse_core(self)
