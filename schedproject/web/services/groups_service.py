from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

from routes.groups_routes import GroupsRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class GroupsService(AbstractService):
    _table_name = "groups"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, GroupsRoutes)
