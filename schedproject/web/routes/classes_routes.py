from flask import request, jsonify, render_template
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ClassesRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):

        @AbstractRoutes.INTERFACES_BLUEPRINT.route("classes-sectioning")
        def classes_sectioning_entry():
            return render_template("classes_sectioning.html"), 200

        @self.blueprint.route("/<int:class_id>/modalities", methods=["GET"])
        def get_class_modalities(class_id: int):
            try:
                result = self.app.classes_service.get_class_modalities(class_id)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:class_id>/modalities", methods=["POST"])
        def add_modalities_to_class(class_id: int):
            try:
                modality_ids = request.get_json()["modality_ids"]
                result = self.app.classes_service.add_modalities_to_class(
                    class_id, modality_ids
                )
                return jsonify({"success": result}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route(
            "/<int:class_id>/modalities/<int:modality_id>", methods=["DELETE"]
        )
        def remove_modality_from_class(class_id: int, modality_id: int):
            try:
                result = self.app.classes_service.remove_modality_from_class(
                    class_id, modality_id
                )
                return jsonify({"success": result}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:class_id>/groups", methods=["GET"])
        def get_class_groups(class_id: int):
            try:
                result = self.app.classes_service.get_class_groups(class_id)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:class_id>/groups", methods=["POST"])
        def add_groups_to_class(class_id: int):
            try:
                group_ids = request.get_json()["group_ids"]
                result = self.app.classes_service.add_groups_to_class(
                    class_id, group_ids
                )
                return jsonify({"success": result}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route(
            "/<int:class_id>/groups/<int:group_id>", methods=["DELETE"]
        )
        def remove_group_from_class(class_id: int, group_id: int):
            try:
                result = self.app.classes_service.remove_group_from_class(
                    class_id, group_id
                )
                return jsonify({"success": result}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/modality/<int:modality_id>", methods=["GET"])
        def get_classes_by_modality(modality_id: int):
            try:
                result = self.app.classes_service.get_classes_by_modality(modality_id)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
