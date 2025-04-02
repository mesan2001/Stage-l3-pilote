from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from flask import render_template, request, jsonify

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class RulesRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    @AbstractRoutes.INTERFACES_BLUEPRINT.route("rule-editor")
    def selector_entry():
        return render_template("rule_editor.html"), 200

    def _register_additional_routes(self):
        @self.blueprint.route("/<int:rule_id>/complete", methods=["GET"])
        def get_rule_with_complete_data(rule_id):
            try:
                result = self.app.rules_service.get_rule_with_complete_data(rule_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:rule_id>/selectors", methods=["GET"])
        def get_selectors_for_rule(rule_id):
            try:
                result = self.app.rules_service.get_selectors_for_rule(rule_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route(
            "/<int:rule_id>/selectors/<int:selector_id>", methods=["POST"]
        )
        def add_selector_to_rule(rule_id, selector_id):
            try:
                result = self.app.rules_service.add_selector_to_rule(
                    rule_id, selector_id
                )
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route(
            "/<int:rule_id>/selectors/<int:selector_id>", methods=["DELETE"]
        )
        def remove_selector_from_rule(rule_id, selector_id):
            try:
                result = self.app.rules_service.remove_selector_from_rule(
                    rule_id, selector_id
                )
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/with-selectors", methods=["POST"])
        def create_with_selectors():
            try:
                data = request.get_json()
                rule_data = data.get("rule", {})
                selector_ids = data.get("selector_ids", [])

                result = self.app.rules_service.create_with_selectors(
                    rule_data, selector_ids
                )
                return jsonify(result), 201
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:rule_id>/selectors", methods=["PUT"])
        def update_rule_selectors(rule_id):
            try:
                data = request.get_json()
                selector_ids = data.get("selector_ids", [])

                result = self.app.rules_service.update_rule_selectors(
                    rule_id, selector_ids
                )
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500


class SelectorsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):
        @self.blueprint.route("/<int:selector_id>/filters", methods=["GET"])
        def get_selector_with_filters(selector_id):
            try:
                result = self.app.selectors_service.get_selector_with_filters(
                    selector_id
                )
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:selector_id>/filters", methods=["POST"])
        def add_filter_to_selector(selector_id):
            try:
                filter_data = request.get_json()
                result = self.app.selectors_service.add_filter_to_selector(
                    selector_id, filter_data
                )
                return jsonify(result), 201
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:selector_id>/representation", methods=["GET"])
        def get_selector_text_representation(selector_id):
            try:
                result = self.app.selectors_service.get_selector_text_representation(
                    selector_id
                )
                return jsonify({"representation": result}), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500


class FiltersRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):
        @self.blueprint.route("/<int:filter_id>/representation", methods=["GET"])
        def get_filter_text_representation(filter_id):
            try:
                result = self.app.filters_service.get_filter_text_representation(
                    filter_id
                )
                return jsonify({"representation": result}), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500
