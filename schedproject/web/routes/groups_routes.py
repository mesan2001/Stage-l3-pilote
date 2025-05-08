from flask import render_template
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class GroupsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):

        @AbstractRoutes.INTERFACES_BLUEPRINT.route("groups-manager")
        def groups_entry():
            return render_template("groups.html"), 200
