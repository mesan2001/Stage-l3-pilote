import os
import toml
import logging
import clingo
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


class MissingCoreTableDefinition(Exception):
    pass


class InvalidCoreTableDefinition(Exception):
    pass


class CoreTableCyclicDependency(Exception):
    pass


class CoreTableConfiguration:

    def __init__(
        self,
        name: str,
        sql_file: str,
        description: str = "",
        protected_columns: Optional[list[str]] = None,
        depends_on: Optional[List[str]] = None,
    ):
        self.name = name
        self.sql_file = sql_file
        self.description = description
        self.protected_columns = protected_columns or []
        self.depends_on = depends_on or []

    def __str__(self) -> str:
        return (
            f"CoreTableConfiguration(name='{self.name}', sql_file='{self.sql_file}', "
            f"description='{self.description}', protected_columns={self.protected_columns}, "
            f"depends_on={self.depends_on})"
        )

    @staticmethod
    def from_dict(
        name: str, config: Dict[str, Any], sql_file: str
    ) -> "CoreTableConfiguration":
        return CoreTableConfiguration(
            name=name,
            sql_file=sql_file,
            description=config.get("description", ""),
            protected_columns=config.get("protected_columns", []),
            depends_on=config.get("depends_on", []),
        )


class WarehouseCore:

    DEFAULT_CORE_PATH = "./databridging/core"

    @staticmethod
    def get_core_tables_metadata(
        core_path: Optional[str] = None,
    ) -> Dict[str, CoreTableConfiguration]:
        core_path = core_path or WarehouseCore.DEFAULT_CORE_PATH

        metadata_path = os.path.join(core_path, "core_tables.toml")

        if not os.path.exists(metadata_path):
            logger.warning(f"Core tables metadata file not found at {metadata_path}")
            return {}

        try:
            metadata = toml.load(metadata_path)

            sql_files = {}
            sql_dir = os.path.join(core_path, "sql")

            if os.path.exists(sql_dir):
                for file in os.listdir(sql_dir):
                    if file.endswith(".sql"):
                        table_name = file[:-4]
                        sql_files[table_name] = os.path.join(sql_dir, file)

            result = {}
            for table_name in metadata["tables"]:
                if table_name not in sql_files:
                    logger.error(f"Missing SQL file for core table {table_name}")
                    raise MissingCoreTableDefinition(
                        f"No SQL file found for {table_name}"
                    )

                table_config = metadata["tables"][table_name]

                result[table_name] = CoreTableConfiguration.from_dict(
                    name=table_name, config=table_config, sql_file=sql_files[table_name]
                )

            return result

        except Exception as e:
            logger.error(f"Error loading core tables metadata: {str(e)}")
            raise

    @staticmethod
    def compute_core_tables_order(
        tables: Dict[str, CoreTableConfiguration],
    ) -> List[CoreTableConfiguration]:
        logger.info("Computing core tables execution order")

        if not tables:
            logger.info("No core tables to process")
            return []

        class ModelHolder:
            def __init__(self) -> None:
                self.models: list[list[clingo.Symbol]] = []

            def __call__(self, model: clingo.Model):
                ret = []
                symbols = model.symbols(shown=True)
                for symbol in symbols:
                    ret.append(symbol)
                self.models.append(ret)

        ctl = clingo.Control(arguments=["1"])

        ctl.load("./resources/staging_order.lp")

        main_program = ""

        for table_name in tables.keys():
            main_program += f'task("{table_name}").\n'

        for table_name, config in tables.items():
            main_program += f'task_p("{table_name}", "{table_name}").\n'

            for dependency in config.depends_on:
                if dependency in tables:
                    main_program += f'task_r("{table_name}", "{dependency}").\n'
                else:
                    logger.warning(
                        f"Table {table_name} depends on {dependency} which is not defined"
                    )

        ctl.add("core_tables", [], main_program)
        ctl.ground([("base", []), ("core_tables", [])])

        mh = ModelHolder()

        def on_unsat(*kwargs):
            logger.error("Cyclic dependency detected in core tables")
            raise CoreTableCyclicDependency("Cyclic dependency detected in core tables")

        ctl.solve(on_unsat=on_unsat, on_model=mh)

        if not mh.models:
            logger.error("No valid ordering found for core tables")
            return []

        pre_order = {
            symbol.arguments[0].string: symbol.arguments[1].number
            for symbol in mh.models[-1]
        }

        ordered_tables = [
            tables[table_name]
            for table_name in sorted(pre_order, key=lambda x: pre_order[x])
        ]

        logger.info(f"Computed order for {len(ordered_tables)} core tables")
        return ordered_tables

    @staticmethod
    def get_core_tables_in_order(
        core_path: Optional[str] = None,
    ) -> List[CoreTableConfiguration]:
        core_path = core_path or WarehouseCore.DEFAULT_CORE_PATH

        all_tables = WarehouseCore.get_core_tables_metadata(core_path)

        return WarehouseCore.compute_core_tables_order(all_tables)

    @staticmethod
    def get_protected_columns(
        table_name: str, core_path: Optional[str] = None
    ) -> List[str]:
        core_tables = WarehouseCore.get_core_tables_metadata(core_path)

        if table_name in core_tables:
            return core_tables[table_name].protected_columns

        return []

    @staticmethod
    def get_sql_for_table(
        table_name: str, core_path: Optional[str] = None
    ) -> Optional[str]:
        core_tables = WarehouseCore.get_core_tables_metadata(core_path)

        if table_name not in core_tables:
            return None

        table_config = core_tables[table_name]

        try:
            with open(table_config.sql_file, "r") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading SQL file for {table_name}: {str(e)}")
            return None

    @staticmethod
    def is_core_table(table_name: str, core_path: Optional[str] = None) -> bool:
        core_tables = WarehouseCore.get_core_tables_metadata(core_path)
        return table_name in core_tables

    @staticmethod
    def visualize_core_table_order(ordered_tables: List[CoreTableConfiguration]) -> str:
        result = []

        if not ordered_tables:
            result.append("  (No core tables configured)")
            return "\n".join(result)

        for index, config in enumerate(ordered_tables):
            result.append(f"  {index+1}. {config.name}")
            if config.depends_on:
                result.append(f"     ├── Depends on: {', '.join(config.depends_on)}")
            if config.protected_columns:
                result.append(
                    f"     ├── Protected columns: {', '.join(config.protected_columns)}"
                )
            if config.description:
                result.append(f"     └── Description: {config.description}")

        return "\n".join(result)
