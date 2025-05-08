from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING
from flask import request, jsonify

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class LabelsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(
            service,
            app,
            table_less=True,
            default_routes=False,
            url_prefix="/api/labels/",
        )

    def _register_additional_routes(self):
        @self.blueprint.route(
            "/resource/<resource_type>/<resource_id>", methods=["GET"]
        )
        def get_labels_for_resource(resource_type, resource_id):
            labels = self.app.labels_service.get_resource_labels(
                resource_type, resource_id
            )
            return jsonify(labels)

        @self.blueprint.route("/regenerate", methods=["POST"])
        def regenerate_labels_view():
            self.app.labels_service.regenerate()
            return jsonify(
                {"success": True, "message": "Labels view regenerated successfully"}
            )

        @self.blueprint.route("/rows", methods=["GET"])
        def get_label_rows():
            resource_type = request.args.get("resource_type")
            label_key = request.args.get("label_key")
            label_value = request.args.get("label_value")

            if not (resource_type and label_value and label_key):
                return jsonify(
                    {
                        "error": "resource_type, label_key and label(_value) should not be None"
                    }
                )

            results = self.app.labels_service.get_label_rows(
                resource_type, label_key, label_value
            )
            return jsonify(results)

        @self.blueprint.route("/associated-resources", methods=["GET"])
        def get_associated_resources():
            resource_type = request.args.get("resource_type")
            label_key = request.args.get("label_key")
            label_value = request.args.get("label_value")
            if not (resource_type and label_value and label_key):
                return jsonify(
                    {
                        "error": "resource_type, label_key and label(_value) should not be None"
                    }
                )

            results = self.app.labels_service.get_associated_resources(
                resource_type, label_key, label_value
            )
            return jsonify(results)
