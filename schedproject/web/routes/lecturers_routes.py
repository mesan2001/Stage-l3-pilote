from flask import jsonify, render_template
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class LecturersRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)


class LecturerAssignmentsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):

        @AbstractRoutes.INTERFACES_BLUEPRINT.route("lecturer-assignments")
        def lecturer_assignments_entry():
            return render_template("lecturer_assignments.html"), 200

        @self.blueprint.route("/by-lecturer/<int:lecturer_id>", methods=["GET"])
        def get_by_lecturer_id(lecturer_id: int):
            try:
                result = self.app.lecturer_assignments_service.get_by_lecturer_id(
                    lecturer_id
                )
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/by-course/<int:course_id>", methods=["GET"])
        def get_by_course_id(course_id: int):
            try:
                result = self.app.lecturer_assignments_service.get_by_course_id(
                    course_id
                )
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/by-modality/<int:modality_id>", methods=["GET"])
        def get_by_modality_id(modality_id: int):
            try:
                result = self.app.lecturer_assignments_service.get_by_modality_id(
                    modality_id
                )
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route(
            "/delete-by-lecturer/<int:lecturer_id>", methods=["DELETE"]
        )
        def delete_lecturer_assignments(lecturer_id: int):
            try:
                self.app.lecturer_assignments_service.delete_lecturer_assignments(
                    lecturer_id
                )
                return "", 204
            except Exception as e:
                return jsonify({"error": str(e)}), 500
