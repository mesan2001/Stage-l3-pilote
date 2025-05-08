import json
import shutil
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from flask import request, jsonify, send_file
import os
from typing import TYPE_CHECKING, override

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class SolverControllerRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app, url_prefix="/")

    @override
    def _register_routes(self):
        @self.blueprint.route("/all", methods=["GET"])
        def get_all():
            try:
                result = self.app.solver_controller_service.get_all()
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/ready", methods=["GET"])
        def get_ready():
            try:
                result = self.app.solver_controller_service.get_ready()
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/finished", methods=["GET"])
        def get_finished():
            try:
                result = self.app.solver_controller_service.get_finished()
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/in-progress", methods=["GET"])
        def get_in_progress():
            try:
                result = self.app.solver_controller_service.get_in_progress()
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/new", methods=["POST"])
        def new_solver_instance():
            try:
                data = request.get_json()
                instance = data.get("instance")
                strategy = data.get("strategy")
                name = data.get("name")

                if not instance or not strategy:
                    return (
                        jsonify(
                            {
                                "error": "Missing required parameters: instance and strategy"
                            }
                        ),
                        400,
                    )

                result = self.app.solver_controller_service.new(
                    name, instance, strategy
                )
                return jsonify(result), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/status", methods=["GET"])
        def get_status(instance_id):
            try:
                result = self.app.solver_controller_service.status(instance_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/start", methods=["POST"])
        def start_instance(instance_id):
            try:
                result = self.app.solver_controller_service.start(instance_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/stop", methods=["POST"])
        def stop_instance(instance_id):
            try:
                result = self.app.solver_controller_service.stop(instance_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/result", methods=["GET"])
        def get_result(instance_id):
            try:

                return (
                    jsonify(
                        self.app.solver_controller_service.load_result(instance_id)
                    ),
                    200,
                )
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/rename", methods=["POST"])
        def rename_instance(instance_id):
            try:
                if (
                    instance_id
                    not in self.app.solver_controller_service.solver_controller_holder
                ):
                    return (
                        jsonify(
                            {
                                "error": f"No solver controller found with ID: {instance_id}"
                            }
                        ),
                        404,
                    )

                data = request.get_json()
                new_name = data.get("name")

                if not new_name:
                    return jsonify({"error": "Name is required"}), 400

                controller = (
                    self.app.solver_controller_service.solver_controller_holder[
                        instance_id
                    ]
                )
                controller.name = new_name
                controller.save()

                return (
                    jsonify({"success": True, "controller": controller.to_json()}),
                    200,
                )
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/logs", methods=["GET"])
        def get_logs(instance_id):
            try:
                if (
                    instance_id
                    not in self.app.solver_controller_service.solver_controller_holder
                ):
                    return (
                        jsonify(
                            {
                                "error": f"No solver controller found with ID: {instance_id}"
                            }
                        ),
                        404,
                    )

                controller = (
                    self.app.solver_controller_service.solver_controller_holder[
                        instance_id
                    ]
                )

                if not controller.working_dir:
                    return jsonify({"error": "Working directory not found"}), 404

                log_path = os.path.join(controller.working_dir, "solver.log")

                if not os.path.exists(log_path):
                    return jsonify({"logs": "No logs available"}), 200

                with open(log_path, "r") as f:
                    logs = f.read()

                return jsonify({"logs": logs}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/instance", methods=["GET"])
        def get_instance_file(instance_id):
            try:
                if (
                    instance_id
                    not in self.app.solver_controller_service.solver_controller_holder
                ):
                    return (
                        jsonify(
                            {
                                "error": f"No solver controller found with ID: {instance_id}"
                            }
                        ),
                        404,
                    )

                controller = (
                    self.app.solver_controller_service.solver_controller_holder[
                        instance_id
                    ]
                )

                if not os.path.exists(controller.instance_path):
                    return jsonify({"error": "Instance file not found"}), 404

                with open(controller.instance_path, "r") as f:
                    instance_content = json.load(f)

                return jsonify({"success": True, "instance": instance_content}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/strategy", methods=["GET"])
        def get_strategy_file(instance_id):
            try:
                if (
                    instance_id
                    not in self.app.solver_controller_service.solver_controller_holder
                ):
                    return (
                        jsonify(
                            {
                                "error": f"No solver controller found with ID: {instance_id}"
                            }
                        ),
                        404,
                    )

                controller = (
                    self.app.solver_controller_service.solver_controller_holder[
                        instance_id
                    ]
                )

                if not os.path.exists(controller.strategy_path):
                    return jsonify({"error": "Strategy file not found"}), 404

                with open(controller.strategy_path, "r") as f:
                    strategy_content = json.load(f)

                return jsonify({"success": True, "strategy": strategy_content}), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/instance", methods=["PUT"])
        def update_instance_file(instance_id):
            try:
                if (
                    instance_id
                    not in self.app.solver_controller_service.solver_controller_holder
                ):
                    return (
                        jsonify(
                            {
                                "error": f"No solver controller found with ID: {instance_id}"
                            }
                        ),
                        404,
                    )

                controller = (
                    self.app.solver_controller_service.solver_controller_holder[
                        instance_id
                    ]
                )

                if controller.status in ["PARSING", "SOLVING"]:
                    return (
                        jsonify(
                            {
                                "error": "Cannot update instance file while solver is running"
                            }
                        ),
                        400,
                    )

                data = request.get_json()
                instance_content = data.get("instance")

                if not instance_content:
                    return jsonify({"error": "Instance content is required"}), 400

                backup_path = controller.instance_path + ".bak"
                try:
                    shutil.copy2(controller.instance_path, backup_path)
                except Exception as e:
                    return jsonify({"error": f"Failed to create backup: {str(e)}"}), 500

                try:
                    with open(controller.instance_path, "w") as f:
                        json.dump(instance_content, f, indent=2)

                    if controller.status in ["FINISHED", "FAILED"]:
                        controller.status = "READY"
                        controller.decision_path = None
                        controller.statistics_path = None
                        controller.solution_path = None
                        controller.experiment_dir = None
                        controller.save()

                    return (
                        jsonify({"success": True, "controller": controller.to_json()}),
                        200,
                    )
                except Exception as e:
                    if os.path.exists(backup_path):
                        shutil.copy2(backup_path, controller.instance_path)
                    return (
                        jsonify({"error": f"Failed to update instance file: {str(e)}"}),
                        500,
                    )
                finally:
                    if os.path.exists(backup_path):
                        os.remove(backup_path)
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>/strategy", methods=["PUT"])
        def update_strategy_file(instance_id):
            try:
                if (
                    instance_id
                    not in self.app.solver_controller_service.solver_controller_holder
                ):
                    return (
                        jsonify(
                            {
                                "error": f"No solver controller found with ID: {instance_id}"
                            }
                        ),
                        404,
                    )

                controller = (
                    self.app.solver_controller_service.solver_controller_holder[
                        instance_id
                    ]
                )

                if controller.status in ["PARSING", "SOLVING"]:
                    return (
                        jsonify(
                            {
                                "error": "Cannot update strategy file while solver is running"
                            }
                        ),
                        400,
                    )

                data = request.get_json()
                strategy_content = data.get("strategy")

                if not strategy_content:
                    return jsonify({"error": "Strategy content is required"}), 400

                backup_path = controller.strategy_path + ".bak"
                try:
                    shutil.copy2(controller.strategy_path, backup_path)
                except Exception as e:
                    return jsonify({"error": f"Failed to create backup: {str(e)}"}), 500

                try:
                    with open(controller.strategy_path, "w") as f:
                        json.dump(strategy_content, f, indent=2)

                    if controller.status in ["FINISHED", "FAILED"]:
                        controller.status = "READY"
                        controller.decision_path = None
                        controller.statistics_path = None
                        controller.solution_path = None
                        controller.experiment_dir = None
                        controller.save()

                    return (
                        jsonify({"success": True, "controller": controller.to_json()}),
                        200,
                    )
                except Exception as e:
                    if os.path.exists(backup_path):
                        shutil.copy2(backup_path, controller.strategy_path)
                    return (
                        jsonify({"error": f"Failed to update strategy file: {str(e)}"}),
                        500,
                    )
                finally:
                    if os.path.exists(backup_path):
                        os.remove(backup_path)
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route("/<int:instance_id>", methods=["DELETE"])
        def delete_instance(instance_id):
            try:
                result = self.app.solver_controller_service.clear(instance_id)
                return jsonify(result), 200
            except ValueError as e:
                return jsonify({"error": str(e)}), 404
            except Exception as e:
                return jsonify({"error": str(e)}), 500
