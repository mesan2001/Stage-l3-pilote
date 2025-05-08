import json
import logging
import time
from typing import TYPE_CHECKING, Any, Optional, Dict, List, Tuple, Set

from services.abstract_service import ID, AbstractService
from services.database_service import FilterSet, equals
from routes.labels_routes import LabelsRoutes
from utils.statistics import stats
from .label_view_generator import LabelsViewGenerator

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class LabelsService(AbstractService):
    _table_name = "labels"

    def __init__(self, app: "InterfacesWebApp"):
        self.app = app
        self.lvg = LabelsViewGenerator(app.db_service)
        super().__init__(app)
        self.routes = LabelsRoutes(app=app, service=self).commit_routes()

    def regenerate(self):
        self.lvg.regenerate()

    @stats
    def get_resource_labels(self, resource_type: str, resource_id: str) -> list[dict]:
        ancestors = self.lvg.all_parents.get(resource_type, [])

        sources = []
        params = []

        sources.append(
            """
            SELECT
                %s::TEXT AS target_type,
                %s::TEXT AS target_id,
                %s::TEXT AS source_type,
                %s::TEXT AS source_id
            """
        )
        params.extend([resource_type, resource_id, resource_type, resource_id])

        for ancestor_type in ancestors:
            join_sql, _ = self.lvg.create_join(resource_type, ancestor_type)

            resource_id_col = self.app.db_service.get_id_column(resource_type)
            ancestor_id_col = self.app.db_service.get_id_column(ancestor_type)

            sources.append(
                f"""
                SELECT
                    %s::TEXT AS target_type,
                    %s::TEXT AS target_id,
                    '{ancestor_type}'::TEXT AS source_type,
                    {ancestor_type}.{ancestor_id_col}::TEXT AS source_id
                FROM {resource_type}
                {join_sql}
                WHERE {resource_type}.{resource_id_col} = %s
                AND {ancestor_type}.{ancestor_id_col} IS NOT NULL
            """
            )
            params.extend([resource_type, resource_id, resource_id])

        sources_cte = (
            "WITH label_sources AS (\n" + "\nUNION ALL\n".join(sources) + "\n)"
        )

        query = f"""
        {sources_cte}

        SELECT
            label_sources.target_type AS resource_type,
            label_sources.target_id AS resource_id,
            sal.label_key,
            sal.label,
            label_sources.source_type AS origin
        FROM label_sources
        JOIN self_assigned_labels sal ON
            sal.resource_type = label_sources.source_type AND
            sal.resource_id = label_sources.source_id
        """

        return self.app.db_service.execute_query(query, params)

    @stats
    def get_resources_labels(
        self, resource_pairs: list[tuple[str, str]]
    ) -> dict[tuple[str, str], list[dict]]:

        if not resource_pairs:
            return {}

        input_values = []
        params = []

        for res_type, res_id in resource_pairs:
            input_values.append("(%s::TEXT, %s::TEXT)")
            params.extend([res_type, res_id])

        query = f"""
        WITH input_resources(resource_type, resource_id) AS (
            VALUES {', '.join(input_values)}
        )

        SELECT
            ir.resource_type,
            ir.resource_id,
            sal.label_key,
            sal.label,
            ir.resource_type AS origin
        FROM input_resources ir
        JOIN self_assigned_labels sal ON
            sal.resource_type = ir.resource_type AND
            sal.resource_id = ir.resource_id
        """

        resources_by_type = {}
        for res_type, res_id in resource_pairs:
            if res_type not in resources_by_type:
                resources_by_type[res_type] = []
            resources_by_type[res_type].append(res_id)

        for resource_type, res_ids in resources_by_type.items():
            ancestors = self.lvg.all_parents.get(resource_type, [])

            for ancestor_type in ancestors:
                join_sql, tables_used = self.lvg.create_join(
                    resource_type, ancestor_type
                )

                resource_id_col = self.app.db_service.get_id_column(resource_type)
                ancestor_id_col = self.app.db_service.get_id_column(ancestor_type)

                corrected_join_sql = join_sql.replace(f"{resource_type}", "res")

                ancestor_alias = ancestor_type
                for table in tables_used:
                    if table.startswith(ancestor_type + " "):
                        ancestor_alias = table.split(" ")[1]

                id_placeholders = []
                for res_id in res_ids:
                    id_placeholders.append("%s")
                    params.append(res_id)

                query += f"""
                UNION ALL

                SELECT
                    '{resource_type}'::TEXT AS resource_type,
                    res.{resource_id_col}::TEXT AS resource_id,
                    sal.label_key,
                    sal.label,
                    '{ancestor_type}'::TEXT AS origin
                FROM {resource_type} res
                {corrected_join_sql}
                JOIN self_assigned_labels sal ON
                    sal.resource_type = '{ancestor_type}' AND
                    sal.resource_id = {ancestor_alias}.{ancestor_id_col}::TEXT
                WHERE res.{resource_id_col}::TEXT IN ({','.join(id_placeholders)})
                AND {ancestor_alias}.{ancestor_id_col} IS NOT NULL
                """

        results = self.app.db_service.execute_query(query, params)

        organized_results = {}
        for row in results:
            key = (row["resource_type"], row["resource_id"])
            if key not in organized_results:
                organized_results[key] = []
            organized_results[key].append(row)

        for pair in resource_pairs:
            if pair not in organized_results:
                organized_results[pair] = []

        return organized_results

    @staticmethod
    def make_label_expression(labels: list[dict[str, str]]):
        return ",".join([f"{label["label_key"]}:{label["label"]}" for label in labels])

    def get_label_expression(self, resource_id: str, resource_type: str):
        labels = self.get_resource_labels(
            resource_id=resource_id,
            resource_type=resource_type,
        )
        return LabelsService.make_label_expression(labels)

    @stats
    def get_resources_by_labels(
        self, labels: list[tuple[Optional[str], Optional[str]]], mode: str = "AND"
    ) -> list[dict]:

        if not labels:
            return []

        if any(key is None and value is None for key, value in labels):
            raise ValueError("Invalid label filter: both key and value cannot be None")

        mode = mode.upper()
        if mode not in ["AND", "OR"]:
            raise ValueError("Mode must be either 'AND' or 'OR'")

        label_filters_sql = []
        params = []

        for i, (key, value) in enumerate(labels):
            if key is None:
                label_filters_sql.append(f"(sal.label = %s)")
                params.append(value)
            elif value is None:
                label_filters_sql.append(f"(sal.label_key = %s)")
                params.append(key)
            else:
                label_filters_sql.append(f"(sal.label_key = %s AND sal.label = %s)")
                params.extend([key, value])

        query = f"""
        WITH
        resource_label_sources AS (
            SELECT
                resource_type AS target_type,
                resource_id AS target_id,
                resource_type AS source_type,
                resource_id AS source_id
            FROM self_assigned_labels

            UNION ALL

        """

        for resource_type, ancestors in self.lvg.all_parents.items():
            for ancestor_type in ancestors:
                join_sql, _ = self.lvg.create_join(resource_type, ancestor_type)

                resource_id_col = self.app.db_service.get_id_column(resource_type)
                ancestor_id_col = self.app.db_service.get_id_column(ancestor_type)

                query += f"""
                SELECT
                    '{resource_type}'::TEXT AS target_type,
                    {resource_type}.{resource_id_col}::TEXT AS target_id,
                    '{ancestor_type}'::TEXT AS source_type,
                    {ancestor_type}.{ancestor_id_col}::TEXT AS source_id
                FROM {resource_type}
                {join_sql}
                WHERE {ancestor_type}.{ancestor_id_col} IS NOT NULL

                UNION ALL
                """

        query = query.rsplit("UNION ALL", 1)[0]

        query += """
        ),
        matching_criteria AS (
        """

        for i, filter_condition in enumerate(label_filters_sql):
            query += f"""
            SELECT
                rls.target_type AS resource_type,
                rls.target_id AS resource_id,
                {i} AS criteria_id
            FROM resource_label_sources rls
            JOIN self_assigned_labels sal ON
                sal.resource_type = rls.source_type AND
                sal.resource_id = rls.source_id
            WHERE {filter_condition}
            """

            if i < len(label_filters_sql) - 1:
                query += "UNION ALL\n"

        if mode == "AND":
            having_clause = "HAVING COUNT(DISTINCT criteria_id) = %s"
            params.append(len(labels))
        else:
            having_clause = "HAVING COUNT(DISTINCT criteria_id) > 0"

        query += f"""
        ),
        matching_resources AS (
            SELECT
                resource_type,
                resource_id
            FROM matching_criteria
            GROUP BY resource_type, resource_id
            {having_clause}
        )
        SELECT
            mr.resource_type,
            mr.resource_id,
            sal.label_key,
            sal.label,
            rls.source_type AS origin
        FROM matching_resources mr
        JOIN resource_label_sources rls ON
            mr.resource_type = rls.target_type AND
            mr.resource_id = rls.target_id
        JOIN self_assigned_labels sal ON
            rls.source_type = sal.resource_type AND
            rls.source_id = sal.resource_id
        ORDER BY mr.resource_type, mr.resource_id
        """

        results = self.app.db_service.execute_query(query, params)

        organized_results = {}
        for row in results:
            key = (row["resource_type"], row["resource_id"])
            if key not in organized_results:
                organized_results[key] = {
                    "resource_type": row["resource_type"],
                    "resource_id": row["resource_id"],
                    "labels": [],
                }

            label_entry = {
                "label_key": row["label_key"],
                "label": row["label"],
                "origin": row["origin"],
            }

            if not any(
                l["label_key"] == label_entry["label_key"]
                and l["label"] == label_entry["label"]
                and l["origin"] == label_entry["origin"]
                for l in organized_results[key]["labels"]
            ):
                organized_results[key]["labels"].append(label_entry)

        return list(organized_results.values())

    def get_label_rows(
        self,
        resource_type: str,
        label_key: str,
        label_value: str,
    ) -> list[dict]:

        custom_results = self.app.custom_labels_service.filter(
            FilterSet(
                equals("label", label_value),
                equals("label_key", label_key),
                equals("resource_type", resource_type),
            )
        )

        query = """
            SELECT
                resource_type,
                resource_id,
                label_key,
                label,
                origin
            FROM self_assigned_labels
            WHERE label_key = %s
            AND label = %s
            AND resource_type = %s
        """

        results = self.app.db_service.execute_query(
            query, [label_key, label_value, resource_type]
        )

        results = list(set(custom_results + results))

        return results

    def get_associated_resources(
        self, resource_type: str, label_key: str, label_value: str
    ):
        label_rows = self.get_label_rows(
            resource_type=resource_type, label_key=label_key, label_value=label_value
        )

        return self.app.db_service.get_records(
            resource_type, [l["resource_id"] for l in label_rows]
        )
