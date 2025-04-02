from services.abstract_service import AbstractService

from typing import TYPE_CHECKING

from routes.classrooms_routes import ClassroomsRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ClassroomsService(AbstractService):
    _table_name = "classrooms"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, ClassroomsRoutes)
