import json
import logging
import os
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, TypeAlias

import requests

from utils.statistics import stats


ID: TypeAlias = str | int

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class FilterOperator(Enum):
    EQUALS = "="
    NOT_EQUALS = "!="
    GREATER_THAN = ">"
    LESS_THAN = "<"
    GREATER_EQUAL = ">="
    LESS_EQUAL = "<="
    LIKE = "LIKE"
    ILIKE = "ILIKE"
    IN = "IN"
    NOT_IN = "NOT IN"
    IS_NULL = "IS NULL"
    IS_NOT_NULL = "IS NOT NULL"
    CONTAINS = "LIKE"
    NOT_CONTAINS = "NOT LIKE"
    STARTS_WITH = "LIKE"
    ENDS_WITH = "LIKE"
    BETWEEN = "BETWEEN"

    @classmethod
    def from_string(cls, operator_str: str) -> "FilterOperator":
        try:
            return cls(operator_str)
        except ValueError:
            operator_map = {
                "eq": cls.EQUALS,
                "neq": cls.NOT_EQUALS,
                "gt": cls.GREATER_THAN,
                "lt": cls.LESS_THAN,
                "gte": cls.GREATER_EQUAL,
                "lte": cls.LESS_EQUAL,
                "contains": cls.CONTAINS,
                "not_contains": cls.NOT_CONTAINS,
                "starts_with": cls.STARTS_WITH,
                "ends_with": cls.ENDS_WITH,
            }
            if operator_str.lower() in operator_map:
                return operator_map[operator_str.lower()]
            raise ValueError(f"Invalid operator: {operator_str}")


class Filter:
    def __init__(
        self,
        column: str,
        operator: FilterOperator | str,
        value: Any = None,
        value_type: str | None = None,
    ):
        self.column = column
        self.operator = (
            operator
            if isinstance(operator, FilterOperator)
            else FilterOperator.from_string(operator)
        )
        self.value = self._convert_value(value, value_type) if value_type else value

    @staticmethod
    def _convert_value(value: Any, value_type: str) -> Any:
        if value is None:
            return None

        type_converters = {
            "string": str,
            "integer": int,
            "float": float,
            "boolean": bool,
            "datetime": lambda x: datetime.fromisoformat(x),
            "list": lambda x: list(x) if not isinstance(x, str) else json.loads(x),
        }

        converter = type_converters.get(value_type.lower())
        if not converter:
            raise ValueError(f"Unsupported value type: {value_type}")

        try:
            return converter(value)
        except (ValueError, TypeError) as e:
            raise ValueError(
                f"Cannot convert value '{value}' to type {value_type}: {str(e)}"
            )

    def to_dict(self) -> dict[str, Any]:
        result = {
            "column": self.column,
            "operator": self.operator.value,
            "value": self.value,
        }

        if self.operator in [FilterOperator.CONTAINS, FilterOperator.NOT_CONTAINS]:
            result["value"] = f"%{self.value}%"
        elif self.operator == FilterOperator.STARTS_WITH:
            result["value"] = f"{self.value}%"
        elif self.operator == FilterOperator.ENDS_WITH:
            result["value"] = f"%{self.value}"

        return result

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Filter":
        required_keys = {"column", "operator"}
        if not all(key in data for key in required_keys):
            raise ValueError(f"Missing required keys. Required: {required_keys}")

        return cls(
            column=data["column"],
            operator=data["operator"],
            value=data.get("value"),
            value_type=data.get("value_type"),
        )

    @classmethod
    def from_json(cls, json_str: str) -> "Filter":
        try:
            data = json.loads(json_str)
            return cls.from_dict(data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON string: {str(e)}")

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    def __str__(self) -> str:
        return f"Filter({self.column} {self.operator.value} {self.value})"


class FilterSet:
    def __init__(self, *filters: Filter):
        self.filters: list[Filter] = list(filters)

    def add(self, filter: Filter) -> "FilterSet":
        self.filters.append(filter)
        return self

    def add_all(self, filters: list[Filter]) -> "FilterSet":
        self.filters.extend(filters)
        return self

    def remove(self, filter: Filter) -> "FilterSet":
        self.filters.remove(filter)
        return self

    def clear(self) -> "FilterSet":
        self.filters.clear()
        return self

    def to_list(self) -> list[dict]:
        return [f.to_dict() for f in self.filters]

    def to_json(self) -> str:
        return json.dumps(self.to_list())

    @classmethod
    def from_dict_list(cls, dict_list: list[dict]) -> "FilterSet":
        return cls(*[Filter.from_dict(d) for d in dict_list])

    @classmethod
    def from_json(cls, json_str: str) -> "FilterSet":
        try:
            data = json.loads(json_str)
            if not isinstance(data, list):
                raise ValueError("JSON must represent a list of filters")
            return cls.from_dict_list(data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON string: {str(e)}")

    def __len__(self) -> int:
        return len(self.filters)

    def __iter__(self):
        return iter(self.filters)

    def __getitem__(self, index: int) -> Filter:
        return self.filters[index]


def equals(column: str, value: Any) -> Filter:
    return Filter(column, FilterOperator.EQUALS, value)


def not_equals(column: str, value: Any) -> Filter:
    return Filter(column, FilterOperator.NOT_EQUALS, value)


def greater_than(column: str, value: int | float | datetime) -> Filter:
    return Filter(column, FilterOperator.GREATER_THAN, value)


def less_than(column: str, value: int | float | datetime) -> Filter:
    return Filter(column, FilterOperator.LESS_THAN, value)


def is_null(column: str) -> Filter:
    return Filter(column, FilterOperator.IS_NULL)


def is_not_null(column: str) -> Filter:
    return Filter(column, FilterOperator.IS_NOT_NULL)


def in_list(column: str, values: list[Any]) -> Filter:
    return Filter(column, FilterOperator.IN, values)


def contains(column: str, value: str) -> Filter:
    return Filter(column, FilterOperator.CONTAINS, value)


def ilike(column: str, value: str) -> Filter:
    return Filter(column, FilterOperator.ILIKE, value)


def starts_with(column: str, value: str) -> Filter:
    return Filter(column, FilterOperator.STARTS_WITH, value)


def ends_with(column: str, value: str) -> Filter:
    return Filter(column, FilterOperator.ENDS_WITH, value)


def between(column: str, start: Any, end: Any) -> Filter:
    return Filter(column, FilterOperator.BETWEEN, [start, end])


class DatabaseService:
    def __init__(
        self,
        app: "InterfacesWebApp",
        host: str,
        port: int | str,
        conf_folder: str = "./conf",
    ):
        self.app = app
        self.host = host
        self.port = port
        self.hostport = f"{host}:{port}"
        self.CONF_FOLDER = conf_folder
        self.vt_association = {}
        self.data_repr = {
            "courses": "elementname",
            "view_courses": "elementname",
            "steps": "name",
            "view_steps": "name",
            "modalities": "modality",
            "view_modalities": "modality",
        }

    def init(self):
        self.schema = self.load_schema()
        self.table_hierarchy = self.build_table_hierarchy()
        self.vt_association = self.fetch_view_table_association()
        logger.debug("DatabaseService initialized")

    def fetch_view_table_association(self) -> dict[str, str]:
        try:
            response = requests.get(f"{self.hostport}/view-table-association")
            if response.status_code != 200:
                logger.error("Failed to fetch view-table associations")
                return {}
            associations = response.json()

            return associations
        except Exception as e:
            logger.error(f"Error fetching view-table associations: {str(e)}")
            return {}

    def load_schema(self) -> dict[str, Any]:
        logger.info("Loading database schema")
        schema = self.get_database_schema()
        logger.debug("Schema loaded")
        return schema

    def build_table_hierarchy(self) -> dict[str, list[str]]:
        logger.info("Building table hierarchy")
        table_hierarchy = {}
        for table in self.schema:
            if self.schema[table]["table_type"] not in ["VIEW", "TRANSACTION TABLE"]:
                table_hierarchy[table] = []
        for table, info in self.schema.items():
            if self.schema[table]["table_type"] not in ["VIEW", "TRANSACTION TABLE"]:
                for relationship in info["relationships"]:
                    parent_table = relationship["to"]
                    if table not in table_hierarchy[parent_table]:
                        table_hierarchy[parent_table].append(table)
        logger.debug(f"Table hierarchy built: {table_hierarchy}")
        return table_hierarchy

    def table_exists(self, table_name: str) -> bool:
        if not self.schema:
            self.init()

        exists = table_name in self.schema
        logger.debug(f"Table '{table_name}' exists: {exists}")
        return exists

    def get_parent_table(self, table: str) -> list[str]:
        if self.table_hierarchy is None:
            logger.info("Table hierarchy not loaded, loading schema")
            self.load_schema()

        if self.table_hierarchy:
            parents = [
                parent
                for parent, children in self.table_hierarchy.items()
                if table in children
            ]
            logger.debug(f"Parent tables for {table}: {parents}")
            return parents

        logger.error("Schema is not loaded or is empty")
        raise ValueError("Schema is not loaded or is empty")

    def get_id_column(self, table: str) -> str:
        if table in self.vt_association:

            table = self.vt_association[table]

        table_info = self.get_table_info(table)
        for col_name, col_info in table_info["columns_info"].items():
            if col_info["is_primary_key"]:
                return col_name
        if "id" in table_info["columns_info"]:
            return "id"
        raise ValueError(f"No primary key found for table {table}")

    def get_database_schema(self) -> dict[str, Any]:

        logger.info("Fetching database schema")
        return self.update_database_schema()

    def update_database_schema(self) -> dict[str, Any]:
        logger.info("Fetching database schema from API")

        schema_response = requests.get(f"{self.hostport}/schema/warehouse")
        if schema_response.status_code != 200:
            logger.error("Failed to fetch database schema")
            raise Exception("Failed to fetch database schema")

        detailed_schema = schema_response.json()

        transactions_tables_response = requests.get(
            f"{self.hostport}/transactions_tables"
        )
        if transactions_tables_response.status_code != 200:
            logger.error("Failed to fetch transactions tables")
            raise Exception("Failed to fetch transactions tables")

        transactions_tables = transactions_tables_response.json()

        view_table_association_response = requests.get(
            f"{self.hostport}/view-table-association"
        )
        if view_table_association_response.status_code != 200:
            logger.error("Failed to fetch view-table associations")
            raise Exception("Failed to fetch view-table associations")

        view_table_associations = view_table_association_response.json()

        schema = {}

        for table_name, table_columns in detailed_schema.items():
            table_type = "BASE TABLE"
            if table_name in transactions_tables:
                table_type = "TRANSACTION TABLE"
            elif table_name.startswith("view_"):
                table_type = "VIEW"

            schema[table_name] = {
                "columns": [col["column_name"] for col in table_columns],
                "relationships": [],
                "columns_info": {},
                "table_type": table_type,
            }

            for col in table_columns:
                column_name = col["column_name"]
                schema[table_name]["columns_info"][column_name] = {
                    "name": column_name,
                    "type": col["data_type"],
                    "is_primary_key": col["is_primary_key"],
                    "is_foreign_key": col["is_foreign_key"],
                    "is_core": col.get("is_core", False),
                    "repr_column": self.data_repr.get(table_name, None) == column_name,
                }

                if (
                    col["is_foreign_key"]
                    and col["foreign_table_name"]
                    and col["foreign_column_name"]
                ):
                    relationship = {
                        "from": column_name,
                        "to": col["foreign_table_name"],
                        "foreign_key": col["foreign_column_name"],
                    }
                    if relationship not in schema[table_name]["relationships"]:
                        schema[table_name]["relationships"].append(relationship)

        for view_name, table_name in view_table_associations.items():
            if view_name in schema:
                schema[view_name]["associated_table"] = table_name

        self.save_schema_to_file(schema)
        self.schema = schema
        logger.info(
            f"Database schema fetched and processed - {len(schema)} tables/views found"
        )
        return schema

    def save_schema_to_file(self, schema: dict[str, Any]):
        file_path = os.path.join(self.CONF_FOLDER, "database_schema.json")
        with open(file_path, "w") as f:
            json.dump(schema, f, indent=2)
        logger.info(f"Schema saved to file: {file_path}")

    def get_table_info(self, table_name: str) -> dict[str, Any]:

        if not self.schema:
            self.init()

        if table_name not in self.schema:
            if table_name in self.vt_association:
                table_name = self.vt_association[table_name]
            else:
                logger.error(f"Table '{table_name}' not found in the schema")
                raise ValueError(f"Table '{table_name}' not found in the schema")

        logger.debug(f"Retrieved info for table: {table_name}")
        return self.schema[table_name]

    @stats
    def execute_query(
        self, query: str, params: list[Any] = [], awaits_result: bool = True
    ) -> list[dict[str, Any]]:
        logger.debug(f"Executing query: {query}")
        logger.debug(f"Query parameters: {params}")
        response = requests.post(
            f"{self.hostport}/query/warehouse",
            json={
                "query": query,
                "placeholders": params,
                "awaits_result": awaits_result,
            },
        )
        if response.status_code != 200:
            logger.error(
                f"Query execution failed with status code: {response.status_code}"
            )
            raise Exception("Query execution failed")
        logger.debug("Query executed successfully")
        return response.json()

    @stats
    def build_query(
        self,
        table: str,
        filters: FilterSet | Filter | list[dict[str, Any]] | dict[str, Any],
        previous_results: dict,
    ) -> tuple[str, list[Any]]:
        # logger.info(f"Building query for table: {table}")
        query = f"SELECT * FROM {table} WHERE 1=1"
        params = []

        table_schema = self.get_table_info(table)["columns_info"]

        if isinstance(filters, Filter):
            filter_list = [filters.to_dict()]
        elif isinstance(filters, FilterSet):
            filter_list = filters.to_list()
        elif isinstance(filters, dict):
            filter_list = [filters]
        else:
            filter_list = filters

        for filter_condition in filter_list:
            column = filter_condition["column"]
            operator = filter_condition["operator"]
            value = filter_condition["value"]

            if column in table_schema:
                data_type = table_schema[column]["type"]
                cast_column = f"{column}"

                if operator in ("IS NULL", "IS NOT NULL"):
                    query += f" AND {cast_column} {operator}"
                elif (
                    operator == "BETWEEN"
                    and isinstance(value, list)
                    and len(value) == 2
                ):
                    query += f" AND {cast_column} BETWEEN %s::{data_type} AND %s::{data_type}"
                    params.extend(value)
                elif operator in ("IN", "NOT IN") and isinstance(value, list):
                    query += f" AND {cast_column} {operator} (SELECT UNNEST(%s::{data_type}[]))"
                    params.append(value)
                else:
                    query += f" AND {cast_column} {operator} %s::{data_type}"
                    params.append(value)
            else:
                logger.error(f"Column '{column}' not found in table {table} schema")
                raise ValueError(f"Column '{column}' not found in table {table} schema")

        if previous_results:
            parent_tables = self.get_parent_table(table)
            for parent_table in parent_tables:
                if parent_table in previous_results:
                    parent_table_schema = self.get_table_info(parent_table)[
                        "columns_info"
                    ]
                    parent_column_id = self.get_id_column(parent_table)

                    parent_ids = [
                        row[parent_column_id] for row in previous_results[parent_table]
                    ]

                    if parent_column_id in table_schema:
                        data_type = parent_table_schema[parent_column_id]["type"]
                        cast_column = f"{parent_column_id}"
                        query += f" AND {cast_column} = ANY(%s::{data_type}[])"
                    else:
                        query += f" AND {parent_column_id} = ANY(%s)"
                    params.append(parent_ids)

        logger.debug(f"Built query: {query}")
        logger.debug(f"Query parameters: {params}")
        return query, params

    def apply_hierarchical_filters(
        self, filters: dict[str, list[dict[str, Any]]]
    ) -> dict[str, list[dict[str, Any]]]:
        logger.info(f"Applying hierarchical filters: {filters}")
        if self.table_hierarchy is None:
            self.load_schema()

        processed_tables = set()
        hierarchy_order = []

        def add_table_and_parents(table: str):
            if table not in processed_tables:
                parents = self.get_parent_table(table)
                for parent in parents:
                    add_table_and_parents(parent)
                hierarchy_order.append(table)
                processed_tables.add(table)

        for table in filters.keys():
            add_table_and_parents(table)

        logger.debug(f"Hierarchy order: {hierarchy_order}")

        results = {}
        related_data = {}

        for table in hierarchy_order:
            if table in filters:
                query, params = self.build_query(table, filters[table], results)
                results[table] = self.execute_query(query, params)
                logger.debug(
                    f"Filtered results for {table}: {len(results[table])} rows"
                )

                self.fetch_parent_data(table, results, related_data)

        for table in hierarchy_order:
            if table not in filters and table in results:
                self.fetch_parent_data(table, results, related_data)

        results.update(related_data)

        logger.info("Hierarchical filtering completed")
        return results

    def fetch_parent_data(
        self,
        table: str,
        results: dict[str, list[dict[str, Any]]],
        related_data: dict[str, list[dict[str, Any]]],
    ):
        parents = self.get_parent_table(table)
        for parent in parents:
            if parent not in results and parent not in related_data:
                for relationship in self.schema[table].get("relationships", []):
                    if relationship["to"] == parent:
                        local_key = relationship["from"]
                        foreign_key = relationship["foreign_key"]
                        child_ids = list(
                            set(
                                [
                                    row[local_key]
                                    for row in results[table]
                                    if row[local_key] is not None
                                ]
                            )
                        )
                        if child_ids:
                            parent_query = (
                                f"SELECT * FROM {parent} WHERE {foreign_key} = ANY(%s)"
                            )
                            parent_params = [child_ids]
                            related_data[parent] = self.execute_query(
                                parent_query, parent_params
                            )
                            logger.debug(
                                f"Loaded parent data for {parent}: {len(related_data[parent])} rows"
                            )
                            self.fetch_parent_data(parent, related_data, related_data)

    def get_data_transformation_information(self) -> tuple[bool, list[str]]:
        transformation_occured_data = requests.get(
            f"{self.hostport}/transformation_occured"
        )
        raw_tables_data = requests.get(f"{self.hostport}/tables/raw")

        return (
            bool(transformation_occured_data.json()["transformation_occured"]),
            raw_tables_data.json(),
        )

    def get_record(self, table_name: str, record_id: str) -> dict[str, Any]:
        try:
            primary_key = self.get_id_column(table_name) or "id"
            query = f"""
                    SELECT * FROM {table_name}
                    WHERE {primary_key} = %s;
                """
            result = self.execute_query(query, [record_id])

            if not result:
                return {}

            if len(result) > 1:
                logger.warning(
                    f"Inconsitency found in table {table_name}, found mutltiple data given a record id : {len(result)}"
                )
            return result[0]

        except Exception as e:
            logger.error(f"Error getting record from {table_name}: {str(e)}")
            raise

    def get_records(
        self, table_name: str, record_ids: list[ID]
    ) -> list[dict[str, Any]]:
        try:
            primary_key = self.get_id_column(table_name)
            query = f"""
                    SELECT * FROM {table_name}
                    WHERE {primary_key} = ANY(%s);
                """
            result = self.execute_query(query, [record_ids])

            if not result:
                return []

            return result

        except Exception as e:
            logger.error(f"Error getting records from {table_name}: {str(e)}")
            raise

    def create_record(
        self, table_name: str, data: dict[str, Any], returning: bool = True
    ) -> dict[str, Any]:
        try:
            table_info = self.get_table_info(table_name)
            columns = []
            values = []
            placeholders = []

            for column, value in data.items():
                if column in table_info["columns_info"]:
                    if column == "constraint":
                        columns.append(f'"{column}"')
                    else:
                        columns.append(column)
                    values.append(value)
                    placeholders.append("%s")

            if not columns:
                return {"error": "No valid columns provided"}

            query = f"""
                INSERT INTO {table_name} ({', '.join(columns)})
                VALUES ({', '.join(placeholders)})
                RETURNING *;
            """

            result = self.execute_query(query, values)
            if returning:
                return result[0]
            return {"success": True}

        except Exception as e:
            logger.error(f"Error creating record in {table_name}: {str(e)}")
            raise

    def create_records(
        self, table_name: str, data: list[dict[str, Any]], returning: bool = True
    ) -> list[dict[str, Any]]:
        try:
            if not data:
                return [] if returning else [{"success": True}]

            table_info = self.get_table_info(table_name)

            first_record = data[0]
            valid_columns = []
            for column in first_record.keys():
                if column in table_info["columns_info"]:
                    if column == "constraint":
                        valid_columns.append(f'"{column}"')
                    else:
                        valid_columns.append(column)

            if not valid_columns:
                raise ValueError("No valid columns provided")

            values_list = []
            all_values = []

            for record in data:
                record_values = []
                record_placeholders = []

                for column in valid_columns:
                    column_name = column.strip('"')
                    record_values.append(record.get(column_name))
                    record_placeholders.append("%s")

                values_list.append(f"({', '.join(record_placeholders)})")
                all_values.extend(record_values)

            query = f"""
                INSERT INTO {table_name} ({', '.join(valid_columns)})
                VALUES {', '.join(values_list)}
                {" RETURNING *" if returning else ""};
            """

            result = self.execute_query(query, all_values)
            if returning:
                return result
            return [{"success": True}] * len(data)

        except Exception as e:
            logger.error(f"Error creating records in {table_name}: {str(e)}")
            raise

    def update_record(
        self, table_name: str, record_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        try:
            table_info = self.get_table_info(table_name)
            primary_key = self.get_id_column(table_name)

            set_clauses = []
            values = []

            for column, value in data.items():
                if column in table_info["columns_info"] and column != primary_key:
                    if column == "constraint":
                        set_clauses.append(f'"{column}" = %s')
                    else:
                        set_clauses.append(f"{column} = %s")
                    values.append(value)

            if not set_clauses:
                return {"error": "No valid columns to update"}

            values.append(record_id)

            query = f"""
                UPDATE {table_name}
                SET {', '.join(set_clauses)}
                WHERE {primary_key} = %s
                RETURNING *;
            """

            result = self.execute_query(query, values)

            if not result:
                return {"error": f"Record not found in {table_name}"}

            return result[0]

        except Exception as e:
            logger.error(f"Error updating record in {table_name}: {str(e)}")
            raise

    def delete_record(self, table_name: str, record_id: str) -> bool:
        try:
            primary_key = self.get_id_column(table_name)

            check_query = f"""
                SELECT {primary_key} FROM {table_name}
                WHERE {primary_key} = %s;
            """
            exists = self.execute_query(check_query, [record_id])

            if not exists:
                return True

            query = f"""
                DELETE FROM {table_name}
                WHERE {primary_key} = %s
                RETURNING {primary_key};
            """

            self.execute_query(query, [record_id], awaits_result=False)
            return True

        except Exception as e:
            logger.error(f"Error deleting record from {table_name}: {str(e)}")
            raise

    def get_all_records(
        self,
        table_name: str,
        use_limit: bool = False,
        limit: int = 10000,
        offset: int = 0,
    ):
        try:
            query = f"SELECT * FROM {table_name}"
            if use_limit:
                query += " LIMIT %s OFFSET %s"

            count_query = f"SELECT COUNT(*) as total FROM {table_name};"
            total_count = self.execute_query(count_query, [])[0]["total"]

            if use_limit:
                results = self.execute_query(query, [limit, offset])
            else:
                results = self.execute_query(query, [])

            return results
            return {
                "data": results,
                "pagination": {
                    "total": total_count,
                    "limit": limit if use_limit else total_count,
                    "offset": offset if use_limit else 0,
                    "has_more": use_limit and total_count > (offset + limit),
                },
            }

        except Exception as e:
            logger.error(f"Error getting records from {table_name}: {str(e)}")
            raise

    @stats
    def filter_records(
        self,
        table_name: str,
        filters: Filter | FilterSet | list[dict[str, Any]] | dict[str, Any],
        use_limit: bool = False,
        limit: int = 1000,
        offset: int = 0,
    ):
        try:
            query, values = self.build_query(table_name, filters, {})
            results = self.execute_query(query, values)
            return results

        except Exception as e:
            logger.error(f"Error filtering records from {table_name}: {str(e)}")
            raise
