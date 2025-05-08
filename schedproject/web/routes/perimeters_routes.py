from flask import jsonify, request
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class PerimetersRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(
            service,
            app,
            url_prefix="/api/perimeters/",
            default_routes=False,
            table_less=True,
        )

    def _register_additional_routes(self):

        @self.blueprint.route("", methods=["GET"])
        def get_perimeters_given_steps():

            steps = request.args.get("steps", "").split(",")
            steps = [int(step) for step in steps if step]

            if not steps:
                return (
                    jsonify(
                        {"error": "No steps provided. Please include steps parameter."}
                    ),
                    400,
                )

            result = self.app.perimeters_service.create_instance(steps)
            return jsonify(result), 200
