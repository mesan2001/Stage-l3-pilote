import logging
import time
from typing import TYPE_CHECKING, Any, Optional

from services.abstract_service import AbstractService
from services.database_service import FilterSet, equals

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class LabelsViewGenerator:

    considered_tables = [
        "students",
        "calendars",
        "steps",
        "formations",  # Changed from programs
        "courses",
        "groups",
        "classes",
        "lecturers",
        "modalities",
        "classrooms",  # Added classrooms
    ]

    non_considered_columns = {
        "students": ["id"],
        "calendars": ["id", "created_at"],
        "steps": ["id"],
        "formations": ["id"],  # Changed from programs
        "courses": ["id"],
        "groups": ["id"],
        "classes": ["id"],
        "lecturers": ["id"],
        "modalities": ["id"],
        "classrooms": ["id"],  # Added classrooms
    }

    labeling_hierarchy = {
        "students": ["groups"],
        "calendars": ["periods"],  # Changed from programs to periods
        "steps": ["courses"],
        "formations": ["steps"],  # Changed from programs to formations
        "courses": ["modalities"],
        "groups": ["classes"],
        "classes": ["modalities"],
        "lecturers": ["modalities"],
        "modalities": [],
        "classrooms": [],  # Added classrooms
    }

    custom_paths = {
        ("students", "groups"): {
            "junction_table": "student_group_junction",
            "parent_column": "student_id",
            "child_column": "group_id",
        },
        ("groups", "classes"): {
            "junction_table": "group_class_junction",
            "parent_column": "group_id",
            "child_column": "class_id",
        },
        ("classes", "modalities"): {
            "junction_table": "class_modality_junction",
            "parent_column": "class_id",
            "child_column": "modality_id",
        },
        ("lecturers", "modalities"): {
            "junction_table": "lecturer_assignments",
            "parent_column": "lecturer_id",
            "child_column": "modality_id",
        },
        ("steps", "courses"): {  # Changed from programs to steps
            "junction_table": "step_course_junction",
            "parent_column": "step_id",
            "child_column": "course_id",
        },
        ("formations", "steps"): {  # Added this relation
            "junction_table": "steps",
            "parent_column": "formation_id",
            "child_column": "id",
        },
        ("calendars", "periods"): {  # Added this relation
            "junction_table": "periods",
            "parent_column": "calendar_id",
            "child_column": "id",
        },
    }

    def __init__(self, db_service):
        self.db_service = db_service
        db_service.load_schema()

    def _find_relationship_path(self, parent: str, child: str) -> dict:
        custom_path = self.custom_paths.get((parent, child))
        if custom_path:
            return {"type": "custom", "path": custom_path}

        if (
            parent in self.db_service.schema
            and "relationships" in self.db_service.schema[parent]
        ):
            for rel in self.db_service.schema[parent]["relationships"]:
                if rel["to"] == child:
                    return {
                        "type": "direct",
                        "direction": "forward",
                        "column": rel["from"],
                    }

        if (
            child in self.db_service.schema
            and "relationships" in self.db_service.schema[child]
        ):
            for rel in self.db_service.schema[child]["relationships"]:
                if rel["to"] == parent:
                    return {
                        "type": "direct",
                        "direction": "backward",
                        "column": rel["from"],
                    }

        raise ValueError(f"No path found between {parent} and {child}")

    def _generate_propagation_cte(self, parent: str, child: str) -> str:
        path = self._find_relationship_path(parent, child)

        if path["type"] == "direct":
            if path["direction"] == "forward":
                return f"""
                    SELECT
                        '{child}' as resource_type,
                        CAST(c.id AS text) as resource_id,
                        l.label_key,
                        l.label,
                        '{parent}-propagated' as origin
                    FROM {parent} p
                    JOIN {child} c ON c.id = p.{path["column"]}
                    JOIN label_rows l ON l.resource_type = '{parent}'
                        AND l.resource_id = CAST(p.id AS text)
                """
            else:
                return f"""
                    SELECT
                        '{child}' as resource_type,
                        CAST(c.id AS text) as resource_id,
                        l.label_key,
                        l.label,
                        '{parent}-propagated' as origin
                    FROM {parent} p
                    JOIN {child} c ON c.{path["column"]} = p.id
                    JOIN label_rows l ON l.resource_type = '{parent}'
                        AND l.resource_id = CAST(p.id AS text)
                """
        else:
            custom = path["path"]
            return f"""
                SELECT
                    '{child}' as resource_type,
                    CAST(c.id AS text) as resource_id,
                    l.label_key,
                    l.label,
                    '{parent}-propagated' as origin
                FROM {parent} p
                JOIN {custom["junction_table"]} j ON j.{custom["parent_column"]} = p.id
                JOIN {child} c ON c.id = j.{custom["child_column"]}
                JOIN label_rows l ON l.resource_type = '{parent}'
                    AND l.resource_id = CAST(p.id AS text)
            """

    def _generate_base_labels_cte(self) -> str:
        direct_ctes = []
        for table in self.considered_tables:
            table_info = self.db_service.schema[table]
            id_column = self.db_service.get_id_column(table)

            columns = [
                col_name
                for col_name in table_info["columns_info"].keys()
                if col_name not in self.non_considered_columns[table]
            ]

            if columns:
                value_parts = [f"('{col}', CAST({col} AS TEXT))" for col in columns]

                cte = f"""
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
                """
                direct_ctes.append(cte)

        propagation_ctes = []
        for parent, children in self.labeling_hierarchy.items():
            for child in children:
                try:
                    propagation_cte = self._generate_propagation_cte(parent, child)
                    if propagation_cte:
                        propagation_ctes.append(propagation_cte)
                except ValueError as e:
                    logger.warning(f"Skipping label propagation: {e}")

        if not direct_ctes:
            return ""

        return f"""
            WITH RECURSIVE label_rows AS (
                {' UNION ALL '.join(direct_ctes)}
            ), propagated_labels AS (
                {' UNION ALL '.join(propagation_ctes)}
            ), all_labels AS (
                SELECT * FROM label_rows
                UNION ALL
                SELECT * FROM propagated_labels
            )
        """

    def create_labels_view(self):
        base_labels_cte = self._generate_base_labels_cte()

        drop_query = "DROP VIEW IF EXISTS labels CASCADE;"
        self.db_service.execute_query(drop_query, awaits_result=False)

        view_query = f"""
            CREATE VIEW labels AS
            {base_labels_cte}
            SELECT
                resource_type,
                resource_id,
                label_key,
                label,
                origin
            FROM all_labels

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
        logger.info("Labels view created successfully")


def wait_for_labels_view(
    db_service, max_attempts: int = 10, retry_delay: int = 1
) -> bool:

    logger.info("Waiting for labels view to be ready...")

    for attempt in range(max_attempts):
        try:
            db_service.load_schema()
            if db_service.table_exists("labels"):
                logger.info(
                    f"Labels view is ready (attempt {attempt + 1}/{max_attempts})"
                )
                return True

            logger.debug(
                f"Labels view not ready yet (attempt {attempt + 1}/{max_attempts})"
            )
            time.sleep(retry_delay)

        except Exception as e:
            logger.warning(f"Error checking for labels view: {str(e)}")
            time.sleep(retry_delay)

    logger.error(f"Labels view not ready after {max_attempts} attempts")
    return False


class LabelsService(AbstractService):
    _table_name = "labels"

    def __init__(self, app: "InterfacesWebApp"):
        LabelsViewGenerator(app.db_service).create_labels_view()
        wait_for_labels_view(app.db_service)
        super().__init__(app)

    def get_labels_for_resource(
        self, resource_type: str, resource_id: str
    ) -> list[dict[str, Any]]:
        filters = {"resource_type": resource_type, "resource_id": resource_id}
        return self.filter(filters)

    def add_custom_label(
        self, resource_type: str, resource_id: str, key: str, value: str
    ) -> dict[str, Any]:
        data = {
            "resource_type": resource_type,
            "resource_id": resource_id,
            "label_key": key,
            "label": value,
            "origin": "custom-added",
        }
        return self.app.db_service.create_record("custom_labels", data)

    def remove_custom_label(self, label_id: int) -> bool:
        return self.app.db_service.delete_record("custom_labels", str(label_id))

    def get_resources_by_label(
        self, label_key: str, label_value: str, resource_type: Optional[str] = None
    ) -> list[dict[str, Any]]:
        filters = {"label_key": label_key, "label": label_value}
        if resource_type:
            filters["resource_type"] = resource_type
        return self.filter(filters)

    def regenerate_labels_view(self):
        view_generator = LabelsViewGenerator(self.app.db_service)
        view_generator.create_labels_view()
        logger.info("Labels view regenerated")

    def get_label_rows(
        self,
        resource_type: Optional[str] = None,
        label_key: Optional[str] = None,
        label_value: Optional[str] = None,
    ) -> list[dict[str, Any]]:

        filters = FilterSet()

        if resource_type:
            filters.add(equals("resource_type", resource_type))

        if label_key:
            filters.add(equals("label_key", label_key))

        if label_value:
            filters.add(equals("label", label_value))

        return self.filter(filters)

    def get_possible_association(
        self,
        resource_type: Optional[str] = None,
        label_key: Optional[str] = None,
        label_value: Optional[str] = None,
    ):
        results = self.get_label_rows(resource_type, label_key, label_value)
        resource_types = set()
        label_keys = set()
        label_values = set()

        for row in results:
            resource_types.add(row["resource_type"])
            label_keys.add(row["label_key"])
            label_values.add(row["label"])

        resource_types = sorted(list(resource_types))
        label_keys = sorted(list(label_keys))
        label_values = sorted(list(label_values))

        return {
            "resource_types": resource_types,
            "label_keys": label_keys,
            "label_values": label_values,
        }

    def get_associated_resources(
        self,
        resource_type: Optional[str] = None,
        label_key: Optional[str] = None,
        label_value: Optional[str] = None,
    ) -> dict[str, list[dict[str, Any]]]:

        label_rows = self.get_label_rows(resource_type, label_key, label_value)

        resource_types_map = {}
        for row in label_rows:
            obj_type = row["resource_type"]
            obj_id = row["resource_id"]

            if obj_type not in resource_types_map:
                resource_types_map[obj_type] = set()

            resource_types_map[obj_type].add(obj_id)

        result = {}

        for obj_type, obj_ids in resource_types_map.items():
            if not obj_ids:
                continue

            try:
                id_list = list(obj_ids)

                if self.app.db_service.table_exists(obj_type):
                    id_column = self.app.db_service.get_id_column(obj_type)

                    placeholders = ", ".join(["%s"] * len(id_list))
                    query = f"SELECT * FROM {obj_type} WHERE {id_column} IN ({placeholders})"

                    resources = self.app.db_service.execute_query(query, id_list)
                    if resources:
                        result[obj_type] = resources
                else:
                    logger.warning(f"Table {obj_type} does not exist in the database")

            except Exception as e:
                logger.error(f"Error fetching resources for {obj_type}: {str(e)}")

        return result
