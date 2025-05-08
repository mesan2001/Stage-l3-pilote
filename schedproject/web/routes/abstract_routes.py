from flask import Blueprint, request, jsonify
from typing import TYPE_CHECKING

from services.abstract_service import ID

if TYPE_CHECKING:
    from services.abstract_service import AbstractService
    from interface_web_app import InterfacesWebApp


class AbstractRoutes:
    INTERFACES_BLUEPRINT = Blueprint(
        "interfaces", "interfaces", url_prefix="/interfaces/"
    )

    def __init__(
        self,
        service: "AbstractService",
        app: "InterfacesWebApp",
        url_prefix: str = "/api/",
        default_routes: bool = True,
        table_less: bool = False,
    ):

        self.service = service
        self.app = app
        if not table_less:
            url_prefix = url_prefix + self.service.table_name()

        self.blueprint = Blueprint(
            self.__class__.__name__, self.__class__.__name__, url_prefix=url_prefix
        )
        if default_routes:
            self._register_routes()
        self._register_additional_routes()

    def commit_routes(self):
        self.app.flask_app.register_blueprint(self.blueprint)

    def _register_routes(self):
        @self.blueprint.route("/", methods=["GET"])
        def get_all():
            try:
                result = self.service.get_all()
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<id>", methods=["GET"])
        def get_one(id: ID):
            try:
                result = self.service.get_by_id(id)
                if result:
                    return jsonify(result), 200
                return jsonify({"error": "Not found"}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/info", methods=["GET"])
        def get_info():
            try:
                result = self.service.get_columns()
                if result:
                    return jsonify(result), 200
                return jsonify({"error": "Not found"}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/", methods=["POST"])
        def create():
            try:
                data = request.get_json()
                result = self.service.create(data)
                return jsonify(result), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/filter", methods=["POST"])
        def filter():
            try:
                filters = request.get_json()
                result = self.service.filter(filters)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<id>", methods=["PUT"])
        def update(id: ID):
            try:
                data = request.get_json()
                result = self.service.update(id, data)
                if result:
                    return jsonify(result), 200
                return jsonify({"error": "Not found"}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<id>", methods=["DELETE"])
        def delete(id: ID):
            try:
                result = self.service.delete(id)
                if result:
                    return "", 204
                return jsonify({"error": "Not found"}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

    def _register_additional_routes(self):
        pass
