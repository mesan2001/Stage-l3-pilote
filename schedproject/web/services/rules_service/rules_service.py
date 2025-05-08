import json
import logging
from services.abstract_service import ID, AbstractService
from typing import TYPE_CHECKING, Any

from services.database_service import equals

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class RulesService(AbstractService):
    _table_name = "rules"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app)

    def get_complete(self, rule_id: ID):
        rule = self.get_by_id(rule_id)

        if not rule:
            raise ValueError(f"Rule id {rule_id} do not exist")

        try:
            selectors = self.app.selectors_service.get_by_rule_id(rule_id)
        except Exception as e:
            logger.warning(f"Error getting selectors for rule {rule_id}: {e}")
            selectors = []

        rule["selectors"] = selectors
        rule["label"] = self.app.labels_service.get_label_expression(
            "rules", str(rule_id)
        )

        return rule


class SelectorsService(AbstractService):
    _table_name = "selectors"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app)

    def get_by_rule_id(self, rule_id: ID) -> list[dict[str, Any]]:
        return self.filter(equals("rule_id", rule_id))
