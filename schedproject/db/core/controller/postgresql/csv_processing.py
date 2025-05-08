import logging
import re

from core.controller.postgresql.schema_management import SchemaManager
from core.dbconnector import DBConnector
from .utils import CSVActionType
from ...utils import (
    is_valid_table_name,
    read_csv,
    InvalidCSVHeaderTableColumnRepresentation,
)

logger = logging.getLogger(__name__)


class CSVProcessor:
    @staticmethod
    def parse_header(
        paired_headers: list[tuple[str, str]],
    ) -> list[tuple[tuple[str, str], tuple[CSVActionType, str]]]:
        logger.info("Parsing CSV headers")
        ret: list[tuple[tuple[str, str], tuple[CSVActionType, str]]] = []
        for head_from, column_to in paired_headers:

            def verify_head(head: str) -> tuple[str, str]:
                part = head.split(".")
                if len(part) != 2:
                    logger.error(f"Invalid CSV header: {head}")
                    raise InvalidCSVHeaderTableColumnRepresentation()

                table, column = part[0], part[1]
                if not (is_valid_table_name(table) and is_valid_table_name(column)):
                    logger.error(f"Invalid table or column name: {table}.{column}")
                    raise InvalidCSVHeaderTableColumnRepresentation()
                return table, column

            def verify_column(column: str) -> tuple[CSVActionType, str]:
                part = column.split(".")
                if len(part) == 1:
                    return CSVActionType.RENAME, column
                if len(part) == 2:
                    match part[0].upper():
                        case "NEW":
                            return CSVActionType.NEW, part[1]
                        case "DELETE":
                            return CSVActionType.DELETE, part[1]
                        case "RENAME":
                            return CSVActionType.RENAME, part[1]
                        case _:
                            logger.error(f"Invalid CSV action: {part[0]}")
                            raise InvalidCSVHeaderTableColumnRepresentation()
                else:
                    logger.error(f"Invalid CSV header format: {column}")
                    raise InvalidCSVHeaderTableColumnRepresentation()

            table_from, column_from = verify_head(head_from)
            action, column_to = verify_column(column_to)
            if not is_valid_table_name(column_to):
                logger.error(f"Invalid column name: {column_to}")
                raise InvalidCSVHeaderTableColumnRepresentation()

            ret.append(((table_from, column_from), (action, column_to)))

        logger.info(f"Parsed {len(ret)} CSV headers")
        return ret

    @staticmethod
    def query_from_csv(
        file: str, filename: str, dbc: DBConnector, separator: str = ","
    ) -> str:
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
        decomposed_paired_headers = CSVProcessor.parse_header(paired_headers)

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

            schema = SchemaManager.get_table_schema(dbc, table_name=initial_table)
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
                            ...

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
                {", \n".join(column_to_keep) + "," if len(column_to_keep) else ""}
            """

            query += ",\n".join(replacements)
            query += f"\nFROM {initial_table}"
            queries.append(query)

        logger.info(f"Generated {len(queries)} queries from CSV file")
        return ";\n".join(queries) + ";"

    @staticmethod
    def from_other_format(file: str, filename: str, dbc: DBConnector) -> str:
        logger.info(f"Processing file: {filename}")
        if filename.endswith(".tsv"):
            logger.info("Converting TSV to CSV format")
            file = file.replace("\t", ",").replace("    ", ",")
            return CSVProcessor.query_from_csv(file, filename, dbc, separator=",")
        elif filename.endswith(".csv"):
            logger.info("Processing CSV file")
            return CSVProcessor.query_from_csv(file, filename, dbc, separator=",")
        logger.warning(f"Unsupported file format: {filename}")
        return ""
