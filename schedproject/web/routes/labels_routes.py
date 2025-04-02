from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING
from flask import request, jsonify

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class LabelsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):
        @self.blueprint.route(
            "/resource/<resource_type>/<resource_id>", methods=["GET"]
        )
        def get_labels_for_resource(resource_type, resource_id):
            labels = self.app.labels_service.get_labels_for_resource(
                resource_type, resource_id
            )
            return jsonify(labels)

        @self.blueprint.route("/custom", methods=["POST"])
        def add_custom_label():
            data = request.get_json()
            required_fields = ["resource_type", "resource_id", "label_key", "label"]

            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"Missing required field: {field}"}), 400

            result = self.app.labels_service.add_custom_label(
                data["resource_type"],
                data["resource_id"],
                data["label_key"],
                data["label"],
            )
            return jsonify(result)

        @self.blueprint.route("/custom/<label_id>", methods=["DELETE"])
        def remove_custom_label(label_id):
            success = self.app.labels_service.remove_custom_label(label_id)
            return jsonify({"success": success})

        @self.blueprint.route("/search", methods=["GET"])
        def get_resources_by_label():
            label_key = request.args.get("label_key")
            label_value = request.args.get("label_value")
            resource_type = request.args.get("resource_type")

            if not label_key or not label_value:
                return (
                    jsonify(
                        {
                            "error": "Missing required parameters: label_key and label_value"
                        }
                    ),
                    400,
                )

            results = self.app.labels_service.get_resources_by_label(
                label_key, label_value, resource_type
            )
            return jsonify(results)

        @self.blueprint.route("/regenerate", methods=["POST"])
        def regenerate_labels_view():
            self.app.labels_service.regenerate_labels_view()
            return jsonify(
                {"success": True, "message": "Labels view regenerated successfully"}
            )

        @self.blueprint.route("/rows", methods=["GET"])
        def get_label_rows():
            resource_type = request.args.get("resource_type")
            label_key = request.args.get("label_key")
            label_value = request.args.get("label_value")

            results = self.app.labels_service.get_label_rows(
                resource_type, label_key, label_value
            )
            return jsonify(results)

        @self.blueprint.route("/associations", methods=["GET"])
        def get_possible_associations():
            resource_type = request.args.get("resource_type")
            label_key = request.args.get("label_key")
            label_value = request.args.get("label_value")

            results = self.app.labels_service.get_possible_association(
                resource_type, label_key, label_value
            )
            return jsonify(results)

        @self.blueprint.route("/associated-resources", methods=["GET"])
        def get_associated_resources():
            resource_type = request.args.get("resource_type")
            label_key = request.args.get("label_key")
            label_value = request.args.get("label_value")

            results = self.app.labels_service.get_associated_resources(
                resource_type, label_key, label_value
            )
            return jsonify(results)
