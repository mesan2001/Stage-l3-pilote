from flask import jsonify
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class StepsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):
        @self.blueprint.route("/formation/<formation_id>", methods=["GET"])
        def get_steps_given_formation(formation_id):
            try:
                result = self.app.steps_service.get_steps_given_formation(formation_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/course/<course_id>", methods=["GET"])
        def get_steps_given_course(course_id):
            try:
                result = self.app.steps_service.get_steps_given_course(course_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500
