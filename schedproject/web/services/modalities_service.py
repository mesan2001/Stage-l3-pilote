from services.abstract_service import AbstractService
from typing import TYPE_CHECKING
from services.database_service import equals, FilterSet, Filter, FilterOperator
from routes.modalities_routes import ModalitiesRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ModalitiesService(AbstractService):
    _table_name = "modalities"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, ModalitiesRoutes)

    def get_modalities_by_course(self, course_id: str | int) -> list[dict]:
        filters = equals("course_id", course_id)
        return self.filter(filters)
