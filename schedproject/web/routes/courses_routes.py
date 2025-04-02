from flask import jsonify
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class CoursesRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):
        @self.blueprint.route("/step/<int:step_id>", methods=["GET"])
        def get_courses_by_step(step_id: int):
            try:
                result = self.app.courses_service.get_courses_by_step(step_id)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/formation/<int:formation_id>", methods=["GET"])
        def get_courses_by_formation(formation_id: int):
            try:
                result = self.app.courses_service.get_courses_by_formation(formation_id)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
