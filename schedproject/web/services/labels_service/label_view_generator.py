import logging
import time
from typing import TYPE_CHECKING, Any, Optional
from collections import deque

from services.abstract_service import ID, AbstractService
from services.database_service import DatabaseService, FilterSet, equals
from routes.labels_routes import LabelsRoutes
from utils.statistics import stats

from functools import lru_cache

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class LabelsViewGenerator:
    considered_tables = [
        "students",
        "steps",
        "formations",
        "courses",
        "groups",
        "classes",
        "lecturers",
        "modalities",
        "classrooms",
    ]

    non_considered_columns = {
        "students": ["id"],
        "calendars": ["id", "created_at"],
        "steps": ["id"],
        "formations": ["id"],
        "courses": ["id"],
        "groups": ["id"],
        "classes": ["id"],
        "lecturers": ["id"],
        "modalities": ["id"],
        "classrooms": ["id"],
    }

    labeling_hierarchy = {
        "students": ["groups"],
        "groups": ["classes"],
        "classes": ["modalities"],
        "formations": ["steps"],
        "steps": ["courses"],
        "courses": ["modalities"],
        "lecturers": ["modalities"],
        "modalities": [],
    }

    def __init__(self, db_service: DatabaseService) -> None:
        db_service.load_schema()
        self.db_service = db_service
        self.direct_parents = self._find_direct_parents()
        self.direct_children = self._find_direct_children()
        self.all_parents = self._find_all_parents()
        self.all_children = self._find_all_children()
        self.relationship_graph = self._build_relationship_graph()
        self.regenerate()

    def _find_direct_parents(self) -> dict[str, list[str]]:
        direct_parents = {}

        all_items = set(self.labeling_hierarchy.keys())
        for children in self.labeling_hierarchy.values():
            all_items.update(children)

        for item in all_items:
            direct_parents[item] = []

        for parent, children in self.labeling_hierarchy.items():
            for child in children:
                direct_parents[child].append(parent)

        return direct_parents

    def _find_direct_children(self) -> dict[str, list[str]]:
        direct_children = {}

        all_items = set(self.labeling_hierarchy.keys())
        for children in self.labeling_hierarchy.values():
            all_items.update(children)

        for item in all_items:
            direct_children[item] = []

        for parent, children in self.labeling_hierarchy.items():
            direct_children[parent].extend(children)

        return direct_children

    def _find_all_parents(self) -> dict[str, list[str]]:
        all_parents = {}

        all_items = set(self.labeling_hierarchy.keys())
        for children in self.labeling_hierarchy.values():
            all_items.update(children)

        def find_ancestors(item: str, ancestors: set[str], visited: set[str]) -> None:
            if item in visited:
                return

            visited.add(item)

            parents = self.direct_parents.get(item, [])

            for parent in parents:
                ancestors.add(parent)
                find_ancestors(parent, ancestors, visited)

        for item in all_items:
            ancestors = set()
            visited = set()
            find_ancestors(item, ancestors, visited)
            all_parents[item] = list(ancestors)

        return all_parents

    def _find_all_children(self) -> dict[str, list[str]]:
        all_children = {}

        all_items = set(self.labeling_hierarchy.keys())
        for children in self.labeling_hierarchy.values():
            all_items.update(children)

        def find_descendants(
            item: str, descendants: set[str], visited: set[str]
        ) -> None:
            if item in visited:
                return

            visited.add(item)

            children = self.direct_children.get(item, [])

            for child in children:
                descendants.add(child)
                find_descendants(child, descendants, visited)

        for item in all_items:
            descendants = set()
            visited = set()
            find_descendants(item, descendants, visited)
            all_children[item] = list(descendants)

        return all_children

    def _discover_join_paths(self) -> dict[tuple[str, str], dict[str, Any]]:
        logger.info("Discovering join paths from database schema...")

        paths = {}
        schema = self.db_service.schema

        graph = self.relationship_graph

        for parent, children in self.labeling_hierarchy.items():
            for child in children:
                path_info = self._find_shortest_path(graph, child, parent)
                if path_info:
                    paths[(child, parent)] = path_info
                    logger.info(f"Found path from {child} to {parent}: {path_info}")
                else:
                    logger.warning(f"No join path found between {child} and {parent}")

        return paths

    def _build_relationship_graph(self) -> dict[str, list[dict[str, Any]]]:
        graph = {}
        schema = self.db_service.schema
        for table_name in schema:
            if table_name not in graph:
                graph[table_name] = []

        for table_name, table_info in schema.items():
            if "relationships" in table_info:
                for rel in table_info["relationships"]:
                    from_table = table_name
                    to_table = rel["to"]
                    foreign_key = rel["from"]

                    if from_table not in graph:
                        graph[from_table] = []

                    graph[from_table].append(
                        {
                            "table": to_table,
                            "type": "direct",
                            "foreign_key": foreign_key,
                            "referenced_column": rel["foreign_key"],
                        }
                    )

                    if to_table not in graph:
                        graph[to_table] = []

                    graph[to_table].append(
                        {
                            "table": from_table,
                            "type": "reverse",
                            "foreign_key": foreign_key,
                            "referenced_column": rel["foreign_key"],
                        }
                    )

        for table_name, table_info in schema.items():
            if "relationships" in table_info and len(table_info["relationships"]) >= 2:
                relations = table_info["relationships"]
                if (
                    len(relations) == 2
                    and "columns" in table_info
                    and len(table_info["columns"]) <= 4
                ):
                    rel1_table = relations[0]["to"]
                    rel2_table = relations[1]["to"]
                    rel1_col = relations[0]["from"]
                    rel2_col = relations[1]["from"]

                    if rel1_table not in graph:
                        graph[rel1_table] = []
                    if rel2_table not in graph:
                        graph[rel2_table] = []

                    graph[rel1_table].append(
                        {
                            "table": rel2_table,
                            "type": "junction",
                            "junction_table": table_name,
                            "source_column": rel1_col,
                            "target_column": rel2_col,
                        }
                    )

                    graph[rel2_table].append(
                        {
                            "table": rel1_table,
                            "type": "junction",
                            "junction_table": table_name,
                            "source_column": rel2_col,
                            "target_column": rel1_col,
                        }
                    )

        return graph

    def _find_shortest_path(
        self, graph: dict[str, list[dict[str, Any]]], start: str, end: str
    ) -> Optional[dict[str, Any]]:
        if start not in graph or end not in graph:
            return None

        visited = {start}
        queue = deque([(start, [])])

        while queue:
            node, path = queue.popleft()

            if node == end:
                if path:
                    return path[0]
                return None

            for edge in graph[node]:
                next_node = edge["table"]
                if next_node not in visited:
                    visited.add(next_node)
                    new_path = path + [edge]
                    queue.append((next_node, new_path))

                    if next_node == end:
                        return edge

        return None

    def regenerate(self) -> None:
        self._create_self_assigned_labels_view()
        self._create_label_types_table()

    def _create_self_assigned_labels_view(self) -> None:
        drop_table_query = "DROP TABLE IF EXISTS _self_assigned_labels CASCADE;"
        self.db_service.execute_query(drop_table_query, awaits_result=False)

        create_table_query = """
            CREATE TABLE _self_assigned_labels (
                resource_type VARCHAR(50) NOT NULL,
                resource_id TEXT NOT NULL,
                label_key VARCHAR(100) NOT NULL,
                label TEXT NOT NULL,
                origin VARCHAR(50) NOT NULL
            );
        """
        self.db_service.execute_query(create_table_query, awaits_result=False)

        for table in self.considered_tables:
            table_info = self.db_service.schema[table]
            id_column = self.db_service.get_id_column(table)

            columns = [
                col_name
                for col_name in table_info["columns_info"].keys()
                if col_name not in self.non_considered_columns.get(table, [])
            ]

            if columns:
                value_parts = [f"('{col}', CAST({col} AS TEXT))" for col in columns]

                insert_query = f"""
                    INSERT INTO _self_assigned_labels
                    SELECT
                        '{table}' as resource_type,
                        CAST({id_column} AS text) as resource_id,
                        column_name as label_key,
                        column_value as label,
                        'self-assigned' as origin
                    FROM {table}
                    CROSS JOIN LATERAL (
                        VALUES {','.join(value_parts)}
                    ) as t(column_name, column_value)
                    WHERE column_value IS NOT NULL
                """
                self.db_service.execute_query(insert_query, awaits_result=False)

        view_query = """
            CREATE OR REPLACE VIEW self_assigned_labels AS
            SELECT * FROM _self_assigned_labels
            UNION ALL
            SELECT
                resource_type,
                resource_id,
                label_key,
                label,
                origin
            FROM custom_labels;
        """

        self.db_service.execute_query(view_query, awaits_result=False)

    def _create_label_types_table(self) -> None:
        drop_table_query = "DROP TABLE IF EXISTS _label_types CASCADE;"
        self.db_service.execute_query(drop_table_query, awaits_result=False)

        create_query = """
            CREATE TABLE _label_types (
                id SERIAL PRIMARY KEY,
                resource_type VARCHAR(50) NOT NULL,
                label_key VARCHAR(100) NOT NULL,
                source_type VARCHAR(50),
                description VARCHAR(255),
                UNIQUE(resource_type, label_key, source_type)
            );
        """
        self.db_service.execute_query(create_query, awaits_result=False)

        for table in self.considered_tables:
            table_info = self.db_service.schema[table]
            columns = [
                col_name
                for col_name in table_info["columns_info"].keys()
                if col_name not in self.non_considered_columns.get(table, [])
            ]

            for col in columns:
                insert_query = """
                    INSERT INTO _label_types (resource_type, label_key, source_type, description)
                    VALUES (%s, %s, %s, %s);
                """
                self.db_service.execute_query(
                    insert_query,
                    [table, col, "self", f"Self-assigned {col} from {table}"],
                    awaits_result=False,
                )

        hierarchy_map = {}
        for resource_type in self.considered_tables:
            ancestors = set()
            visited = set()
            self._build_ancestors_recursively(resource_type, ancestors, visited)
            hierarchy_map[resource_type] = ancestors

        for resource_type, ancestors in hierarchy_map.items():
            for ancestor in ancestors:
                query = f"""
                    INSERT INTO _label_types (resource_type, label_key, source_type, description)
                    SELECT '{resource_type}', lt.label_key, '{ancestor}', 'Inherited from {ancestor}'
                    FROM _label_types lt
                    WHERE lt.resource_type = '{ancestor}' AND lt.source_type = 'self'
                    ON CONFLICT (resource_type, label_key, source_type) DO NOTHING;
                """
                self.db_service.execute_query(query, [], awaits_result=False)

        view_query = """
            CREATE OR REPLACE VIEW label_types AS
            SELECT * FROM _label_types
            UNION
            SELECT
                DISTINCT ON (resource_type, label_key)
                nextval('_label_types_id_seq'::regclass) as id,
                resource_type,
                label_key,
                'custom' as source_type,
                'Custom defined label' as description
            FROM custom_labels
            WHERE NOT EXISTS (
                SELECT 1 FROM _label_types lt
                WHERE lt.resource_type = custom_labels.resource_type
                AND lt.label_key = custom_labels.label_key
            );
        """
        self.db_service.execute_query(view_query, awaits_result=False)

    def _build_ancestors_recursively(
        self, current: str, ancestors: set[str], visited: set[str]
    ) -> None:
        if current in visited:
            return

        visited.add(current)

        direct_parents = []
        for parent, children in self.labeling_hierarchy.items():
            if current in children:
                direct_parents.append(parent)
                ancestors.add(parent)

        for parent in direct_parents:
            self._build_ancestors_recursively(parent, ancestors, visited)

    @lru_cache(maxsize=128)
    def create_join(self, start_table: str, target_table: str) -> tuple[str, list[str]]:
        schema = self.db_service.schema

        path = self._find_complete_path(start_table, target_table)

        if not path:
            raise ValueError(
                f"No join path found between {start_table} and {target_table}"
            )

        join_clauses = []
        current_table = start_table
        aliases = {start_table: start_table}
        tables_used = [start_table]

        for step in path:
            next_table = step["table"]
            alias = next_table
            aliases[next_table] = alias

            if step["type"] == "direct":
                join_clauses.append(
                    f"LEFT JOIN {next_table} AS {alias} ON {aliases[current_table]}.{step['foreign_key']} = "
                    f"{alias}.{step['referenced_column']}"
                )
                tables_used.append(next_table)

            elif step["type"] == "reverse":
                join_clauses.append(
                    f"LEFT JOIN {next_table} AS {alias} ON {aliases[current_table]}.{step['referenced_column']} = "
                    f"{alias}.{step['foreign_key']}"
                )
                tables_used.append(next_table)

            elif step["type"] == "junction":
                junction_table = step["junction_table"]
                junction_alias = junction_table

                from_col = None
                to_col = None

                for rel in schema[junction_table]["relationships"]:
                    if rel["to"] == current_table:
                        from_col = rel["from"]
                    elif rel["to"] == next_table:
                        to_col = rel["from"]

                if from_col and to_col:
                    join_clauses.append(
                        f"LEFT JOIN {junction_table} AS {junction_alias} ON "
                        f"{aliases[current_table]}.id = {junction_alias}.{from_col}"
                    )
                    join_clauses.append(
                        f"LEFT JOIN {next_table} AS {alias} ON "
                        f"{junction_alias}.{to_col} = {alias}.id"
                    )
                    tables_used.extend([junction_table, next_table])

            current_table = next_table

        return "\n".join(join_clauses), tables_used

    @lru_cache(maxsize=128)
    def _find_complete_path(
        self, start: str, end: str
    ) -> Optional[list[dict[str, Any]]]:
        graph = self.relationship_graph

        if start not in graph or end not in graph:
            return None

        visited = {start}
        queue = deque([(start, [])])

        while queue:
            node, path = queue.popleft()

            if node == end:
                return path

            for edge in graph[node]:
                next_node = edge["table"]
                if next_node not in visited:
                    visited.add(next_node)
                    queue.append((next_node, path + [edge]))

        return None
