from services.abstract_service import AbstractService

from typing import TYPE_CHECKING

from routes import CustomLabelsRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class CustomLabelsService(AbstractService):
    _table_name = "custom_labels"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, CustomLabelsRoutes)
