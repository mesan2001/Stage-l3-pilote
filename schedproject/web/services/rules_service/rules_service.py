import json
import logging
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

from services.database_service import equals

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class RulesService(AbstractService):
    _table_name = "rules"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app)

    def _validate(self, data: dict) -> dict:
        data = super()._validate(data)
        if "constraint" in data:
            data["constraint"] = json.dumps(data["constraint"])
        return data

    def get_rule_with_complete_data(self, rule_id: int) -> dict:
        rule = self.get_by_id(rule_id)

        if not rule:
            raise ValueError(f"Rule with ID {rule_id} not found")

        rule_selectors = self.app.db_service.execute_query(
            """
            SELECT rs.selector_id, s.name, s.operation
            FROM rule_selectors rs
            JOIN selectors s ON rs.selector_id = s.id
            WHERE rs.rule_id = %s
            """,
            [rule_id],
        )

        rule["selectors"] = []
        for selector_data in rule_selectors:
            selector_id = selector_data["selector_id"]

            filters = self.app.filters_service.filter(
                equals("selector_id", selector_id)
            )

            rule["selectors"].append(
                {
                    "id": selector_id,
                    "name": selector_data["name"],
                    "operation": selector_data["operation"],
                    "filters": filters,
                }
            )

        return rule

    def add_selector_to_rule(self, rule_id: int, selector_id: int) -> dict:
        try:
            rule = self.get_by_id(rule_id)
            if not rule:
                raise ValueError(f"Rule with ID {rule_id} not found")

            selector = self.app.selectors_service.get_by_id(selector_id)
            if not selector:
                raise ValueError(f"Selector with ID {selector_id} not found")

            existing = self.app.db_service.execute_query(
                """
                SELECT 1 FROM rule_selectors
                WHERE rule_id = %s AND selector_id = %s
                """,
                [rule_id, selector_id],
            )

            if existing:
                return {
                    "message": f"Selector {selector_id} is already associated with rule {rule_id}"
                }

            self.app.db_service.execute_query(
                """
                INSERT INTO rule_selectors (rule_id, selector_id)
                VALUES (%s, %s)
                """,
                [rule_id, selector_id],
                awaits_result=False,
            )

            return {
                "message": f"Selector {selector_id} successfully added to rule {rule_id}"
            }

        except Exception as e:
            logger.error(f"Error adding selector to rule: {str(e)}")
            raise

    def remove_selector_from_rule(self, rule_id: int, selector_id: int) -> dict:
        try:
            existing = self.app.db_service.execute_query(
                """
                SELECT 1 FROM rule_selectors
                WHERE rule_id = %s AND selector_id = %s
                """,
                [rule_id, selector_id],
            )

            if not existing:
                return {
                    "message": f"Selector {selector_id} is not associated with rule {rule_id}"
                }

            self.app.db_service.execute_query(
                """
                DELETE FROM rule_selectors
                WHERE rule_id = %s AND selector_id = %s
                """,
                [rule_id, selector_id],
                awaits_result=False,
            )

            return {
                "message": f"Selector {selector_id} successfully removed from rule {rule_id}"
            }

        except Exception as e:
            logger.error(f"Error removing selector from rule: {str(e)}")
            raise

    def get_selectors_for_rule(self, rule_id: int) -> list:
        try:
            rule = self.get_by_id(rule_id)
            if not rule:
                raise ValueError(f"Rule with ID {rule_id} not found")

            selectors = self.app.db_service.execute_query(
                """
                SELECT s.*
                FROM selectors s
                JOIN rule_selectors rs ON s.id = rs.selector_id
                WHERE rs.rule_id = %s
                """,
                [rule_id],
            )

            return selectors

        except Exception as e:
            logger.error(f"Error getting selectors for rule: {str(e)}")
            raise

    def create_with_selectors(self, rule_data: dict, selector_ids: list[int]) -> dict:
        try:
            rule = self.create(rule_data)
            rule_id = rule["id"]

            if selector_ids:
                for selector_id in selector_ids:
                    self.add_selector_to_rule(rule_id, selector_id)

            return self.get_rule_with_complete_data(rule_id)

        except Exception as e:
            logger.error(f"Error creating rule with selectors: {str(e)}")
            raise

    def update_rule_selectors(self, rule_id: int, selector_ids: list[int]) -> dict:
        try:
            rule = self.get_by_id(rule_id)
            if not rule:
                raise ValueError(f"Rule with ID {rule_id} not found")

            self.app.db_service.execute_query(
                """
                DELETE FROM rule_selectors
                WHERE rule_id = %s
                """,
                [rule_id],
                awaits_result=False,
            )

            for selector_id in selector_ids:
                selector = self.app.selectors_service.get_by_id(selector_id)
                if not selector:
                    raise ValueError(f"Selector with ID {selector_id} not found")

                self.app.db_service.execute_query(
                    """
                    INSERT INTO rule_selectors (rule_id, selector_id)
                    VALUES (%s, %s)
                    """,
                    [rule_id, selector_id],
                    awaits_result=False,
                )

            return {"message": f"Successfully updated selectors for rule {rule_id}"}

        except Exception as e:
            logger.error(f"Error updating rule selectors: {str(e)}")
            raise


class SelectorsService(AbstractService):
    _table_name = "selectors"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app)

    def get_selector_with_filters(self, selector_id: int) -> dict:
        selector = self.get_by_id(selector_id)
        if not selector:
            raise ValueError(f"Selector with ID {selector_id} not found")

        selector["filters"] = self.app.filters_service.filter(
            equals("selector_id", selector_id)
        )
        print(selector)
        return selector

    def _validate(self, data: dict) -> dict:
        validated_data = super()._validate(data)

        if "operation" in validated_data:
            self._validate_operation(validated_data["operation"])

        validated_data["operation"] = json.dumps(validated_data["operation"])

        return validated_data

    def _validate_operation(self, operation_json):
        if not isinstance(operation_json, list):
            raise ValueError("Operation must be a JSON array")

        if not operation_json:
            return

        valid_operators = ["&", "|", "-"]

        for i, item in enumerate(operation_json):
            if not isinstance(item, list):
                raise ValueError(
                    f"Each element in operation must be an array, got {item}"
                )

            if len(item) == 1 and isinstance(item[0], str):
                if item[0] not in valid_operators:
                    raise ValueError(
                        f"Invalid operator: {item[0]}. Must be one of: {valid_operators}"
                    )

                if i == 0 or i == len(operation_json) - 1:
                    raise ValueError(
                        f"Operator {item[0]} must have operands before and after it"
                    )
            else:
                self._validate_line_array(item)

        for i in range(1, len(operation_json)):
            prev_is_operator = len(operation_json[i - 1]) == 1 and isinstance(
                operation_json[i - 1][0], str
            )
            curr_is_operator = len(operation_json[i]) == 1 and isinstance(
                operation_json[i][0], str
            )

            if prev_is_operator and curr_is_operator:
                raise ValueError(
                    f"Cannot have adjacent operators: {operation_json[i-1][0]} and {operation_json[i][0]}"
                )

    def _validate_line_array(self, line_array):
        if not line_array:
            raise ValueError("Line array cannot be empty")

        if len(line_array) == 1 and isinstance(line_array[0], str):
            if line_array[0] not in ["&", "|", "-"]:
                raise ValueError(f"Invalid standalone operator: {line_array[0]}")
            return

        valid_operators = ["&", "|", "-"]

        for i, element in enumerate(line_array):
            if i % 2 == 0:
                if not isinstance(element, int):
                    raise ValueError(
                        f"Expected filter ID at position {i}, got {element}"
                    )

                filter_exists = self.app.filters_service.get_by_id(element)
                if not filter_exists:
                    raise ValueError(f"Filter with ID {element} does not exist")

            else:
                if not isinstance(element, str) or element not in valid_operators:
                    raise ValueError(
                        f"Expected operator at position {i}, got {element}"
                    )

        if not isinstance(line_array[0], int):
            raise ValueError(
                f"Line array must start with a filter ID, got {line_array[0]}"
            )

        last_position = len(line_array) - 1
        if last_position % 2 == 0 and not isinstance(line_array[last_position], int):
            raise ValueError(
                f"Expected filter ID at position {last_position}, got {line_array[last_position]}"
            )
        elif last_position % 2 == 1 and (
            not isinstance(line_array[last_position], str)
            or line_array[last_position] not in valid_operators
        ):
            raise ValueError(
                f"Expected operator at position {last_position}, got {line_array[last_position]}"
            )

    def add_filter_to_selector(self, selector_id: int, filter_data: dict) -> dict:
        filter_data["selector_id"] = selector_id
        filter = self.app.filters_service.create(filter_data)

        return filter

    def get_selector_text_representation(self, selector_id: int) -> str:
        selector = self.get_by_id(selector_id)
        if not selector:
            raise ValueError(f"Selector with ID {selector_id} not found")

        operations = selector.get("operations", [])

        return self.get_operations_text_representation(operations)

    def get_operations_text_representation(self, operations: list) -> str:
        if not operations:
            return "No filters defined"

        result = []

        for item in operations:
            if (
                len(item) == 1
                and isinstance(item[0], str)
                and item[0] in ["&", "|", "-"]
            ):
                result.append(f" {item[0]} ")
            else:
                line_result = []
                for i, element in enumerate(item):
                    if i % 2 == 0:
                        filter_text = (
                            self.app.filters_service.get_filter_text_representation(
                                element
                            )
                        )
                        line_result.append(filter_text)
                    else:
                        line_result.append(f" {element} ")

                result.append("".join(line_result))

        return "\n".join(result)


class FiltersService(AbstractService):
    _table_name = "filters"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app)

    def get_filter_text_representation(self, filter_id: int) -> str:
        filter = self.app.filters_service.get_by_id(filter_id)
        resource_type = filter.get("resource_type", None)
        label_key = filter.get("label_key", None)
        label_value = filter.get("label_value", None)
        rank = filter.get("rank", [])

        resource_type = "*" if resource_type is None else resource_type
        label_key = "*" if label_key is None else label_key
        label_value = "*" if label_value is None else label_value
        rank_str = "{*}" if not rank else "{" + ",".join(str(r) for r in rank) + "}"

        return f"{resource_type}[{label_key}:{label_value}]{rank_str}"

    def _validate(self, data: dict) -> dict:
        rank = data.get("rank", [])
        data["rank"] = json.dumps(rank)

        return data
