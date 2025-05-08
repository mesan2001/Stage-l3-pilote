import csv
import io
import logging
import re

from enum import Enum

from psycopg.abc import NoneType


class InchoherentStructure(Exception): ...


class InvalidCSVHeaderTableColumnRepresentation(Exception): ...


class InvalidDatabaseName(Exception): ...


class WrongQueryType(Exception): ...


class MissingConfigurationField(Exception): ...


class MissingConfigurationSection(Exception): ...


class InvalidCSVSize(Exception): ...


logger = logging.getLogger(__name__)


class InconsistentStructure(Exception):
    def __init__(self, comparison: dict | None = None) -> None:
        super().__init__("")
        self.comparison = comparison


def is_valid_table_name(table_name):
    return re.match(r"^[A-Za-z][A-Za-z0-9_]*$", table_name) is not None


def is_consistent_structure(json_list):
    if not json_list:
        return False

    base_keys = set(json_list[0].keys())
    for obj in json_list[1:]:
        if set(obj.keys()) != base_keys:
            return False

    return True


def decide_data_type(types):
    types = list(set(types))
    if len(types) > 2:
        return "TEXT"

    elif len(types) == 2:
        if "FLOAT" in types and "INTEGER" in types:
            return "FLOAT"

        if "NULL" in types:
            types.pop(types.index("NULL"))
            return types[0]

    elif len(types) == 1:
        if "TEXT" in types:
            return "TEXT"
        if "FLOAT" in types:
            return "FLOAT"
        if "INTEGER" in types:
            return "FLOAT"
        if "BOOLEAN" in types:
            return "BOOLEAN"

    return "TEXT"


def cast_value(value):
    try:
        if str(value).upper() in ["FALSE", "TRUE"]:
            return "BOOLEAN", str(value).upper() == "TRUE"
    except (ValueError, TypeError):
        pass

    try:
        if int(value) == float(value):
            return "FLOAT", int(value)
    except (ValueError, TypeError):
        pass

    try:
        float(value)
        return "FLOAT", float(value)
    except (ValueError, TypeError):
        pass

    if isinstance(value, str):
        return "TEXT", str(value)

    if isinstance(value, NoneType):
        return "NULL", None

    logger.info(
        f"INFO: found {type(value)} type that is not handled, type attribution : TEXT"
    )
    return "TEXT", str(value)


def analyze_json(json_list, text_only=False):
    if not is_consistent_structure(json_list):
        raise InchoherentStructure()

    data_types = {}

    for idx, obj in enumerate(json_list):
        for key, value in obj.items():
            if text_only:
                casted_type = "TEXT"
                casted_value = str(value)
            else:
                casted_type, casted_value = cast_value(value)

            json_list[idx][key] = casted_value

            if key not in data_types:
                data_types[key] = []

            if casted_type not in data_types[key]:
                data_types[key].append(casted_type)

    final_data_types = {
        key: decide_data_type(types) for key, types in data_types.items()
    }
    return final_data_types, json_list


def compare_dictionaries(ref_dict: dict[str, str], comp_dict: dict[str, str]):
    key_diff = {"missing_columns": [], "extra_column": []}
    value_diff = []

    for key in ref_dict:
        if key not in comp_dict:
            key_diff["missing_columns"].append(key)

    for key in comp_dict:
        if key not in ref_dict:
            key_diff["extra_column"].append(key)

    for key in ref_dict:
        if key in comp_dict and ref_dict[key] != comp_dict[key]:
            value_diff.append(
                {
                    "key": key,
                    "awaited": ref_dict[key],
                    "found": comp_dict[key],
                }
            )

    return {"key_diff": key_diff, "value_diff": value_diff}


def read_csv(file: str, separator: str = ","):
    fileio = io.StringIO(file)

    csv_reader = csv.reader(fileio, delimiter=separator)
    rows = [row for row in csv_reader]
    headers = rows[0]
    rows = rows[1:]

    if len(headers) < 2:
        raise InvalidCSVSize(
            f"Header must have at least 2 columns, found {len(headers)} columns"
        )

    if len(headers) % 2 != 0:
        raise InvalidCSVSize(
            f"Header must have an even number of columns, found {len(headers)} columns"
        )

    paired_headers = [
        (headers[idx], headers[idx + 1]) for idx in range(0, len(headers), 2)
    ]

    paired_columns: list[list[tuple[str, str]]] = [
        ([]) for _ in range(0, len(headers) // 2)
    ]
    for row in rows:
        if len(headers) != len(row):
            raise InvalidCSVSize(
                f"Row must have the same number of columns as the header, found {len(row)} columns, awaited {len(headers)} columns"
            )

        for idx in range(0, len(row), 2):
            if row[idx]:
                paired_columns[idx // 2].append((row[idx], row[idx + 1]))

    return paired_headers, paired_columns


class TransactionStrategy(Enum):
    SINGLE_TABLE = "single_table"
    PER_TABLE = "per_table"
