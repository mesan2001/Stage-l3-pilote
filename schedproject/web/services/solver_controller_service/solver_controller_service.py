import os
import json
import uuid
import shutil
import subprocess
import threading
from glob import glob
from enum import Enum
from typing import TYPE_CHECKING, Any, Optional, override

from services.abstract_service import AbstractService
from routes import SolverControllerRoutes

from .solver_controller import SolverController, SolverStatus

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

import logging

logger = logging.getLogger(__name__)


class SolverControllerService(AbstractService):
    WORKDIR = "/instances"

    def __init__(self, app: "InterfacesWebApp") -> None:
        self._table_name = "solver"
        self.app = app
        os.makedirs(SolverControllerService.WORKDIR, exist_ok=True)
        dirs = os.listdir(SolverControllerService.WORKDIR)

        self.solver_controller_holder: dict[int, SolverController] = {}

        for dir in dirs:
            p = os.path.join(
                SolverControllerService.WORKDIR,
                dir,
                SolverController.INSTANCE_DATA_NAME,
            )
            logger.info(f"Scanning {dir} looking for {p}")
            if os.path.exists(p):
                try:
                    controller = SolverController.load(
                        os.path.join(SolverControllerService.WORKDIR, dir)
                    )
                    self.solver_controller_holder[controller.id] = controller
                    logger.info(
                        f"Loaded solver controller: {controller.name} (ID: {controller.id})"
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to load solver controller from {dir}: {str(e)}"
                    )

        self.routes = SolverControllerRoutes(self, app).commit_routes()

    @override
    def table_name(self) -> str:
        return self._table_name

    def get_all(self) -> list[dict[str, Any]]:
        return [
            controller.to_json()
            for controller in self.solver_controller_holder.values()
        ]

    def get_ready(self) -> list[dict[str, Any]]:
        return [
            controller.to_json()
            for controller in self.solver_controller_holder.values()
            if controller.status == SolverStatus.READY.name
        ]

    def get_in_progress(self) -> list[dict[str, Any]]:
        return [
            controller.to_json()
            for controller in self.solver_controller_holder.values()
            if controller.status
            in [SolverStatus.PARSING.name, SolverStatus.SOLVING.name]
        ]

    def get_finished(self) -> list[dict[str, Any]]:
        return [
            controller.to_json()
            for controller in self.solver_controller_holder.values()
            if controller.status == SolverStatus.FINISHED.name
        ]

    def new(self, name, instance: dict, strategy: dict) -> dict[str, Any]:
        try:
            controller = SolverController.create_new(
                name=name or f"Instance {len(self.solver_controller_holder)}",
                instance_folder=self.WORKDIR,
                instance_file_content=instance,
                strategy_file_content=strategy,
            )
            self.solver_controller_holder[controller.id] = controller
            return {"success": True, "controller": controller.to_json()}
        except Exception as e:
            logger.error(f"Failed to create new solver controller: {str(e)}")
            return {"success": False, "error": str(e)}

    def clear(self, instance_id: int) -> dict[str, Any]:
        if instance_id not in self.solver_controller_holder:
            return {
                "success": False,
                "error": f"No solver controller found with ID: {instance_id}",
            }

        controller = self.solver_controller_holder[instance_id]

        if controller.status in [SolverStatus.PARSING.name, SolverStatus.SOLVING.name]:
            controller.stop()

        del self.solver_controller_holder[instance_id]

        if controller.working_dir and os.path.exists(controller.working_dir):
            try:
                shutil.rmtree(controller.working_dir)
            except Exception as e:
                logger.error(
                    f"Failed to remove folder {controller.working_dir}: {str(e)}"
                )
                return {
                    "success": True,
                    "warning": f"Controller removed but folder could not be deleted: {str(e)}",
                }

        return {"success": True}

    def status(self, instance_id: int) -> dict[str, Any]:
        if instance_id not in self.solver_controller_holder:
            return {
                "success": False,
                "error": f"No solver controller found with ID: {instance_id}",
            }

        controller = self.solver_controller_holder[instance_id]
        return {"success": True, "controller": controller.to_json()}

    def start(self, instance_id: int) -> dict[str, Any]:
        if instance_id not in self.solver_controller_holder:
            return {
                "success": False,
                "error": f"No solver controller found with ID: {instance_id}",
            }

        controller = self.solver_controller_holder[instance_id]

        if controller.status in [SolverStatus.PARSING.name, SolverStatus.SOLVING.name]:
            return {"success": False, "error": "Solver is already running"}

        result = controller.run()

        if result:
            return {"success": True, "controller": controller.to_json()}
        else:
            return {
                "success": False,
                "error": "Failed to start solver",
                "controller": controller.to_json(),
            }

    def stop(self, instance_id: int) -> dict[str, Any]:
        if instance_id not in self.solver_controller_holder:
            return {
                "success": False,
                "error": f"No solver controller found with ID: {instance_id}",
            }

        controller = self.solver_controller_holder[instance_id]

        if controller.status not in [
            SolverStatus.PARSING.name,
            SolverStatus.SOLVING.name,
        ]:
            return {"success": False, "error": "Solver is not running"}

        result = controller.stop()

        if result:
            return {"success": True, "controller": controller.to_json()}
        else:
            return {
                "success": False,
                "error": "Failed to stop solver",
                "controller": controller.to_json(),
            }

    def load_result(self, instance_id: int):
        if instance_id not in self.solver_controller_holder:
            return json.dumps(
                {
                    "success": False,
                    "error": f"No solver controller found with ID: {instance_id}",
                }
            )

        controller = self.solver_controller_holder[instance_id]

        if controller.status != SolverStatus.FINISHED.name:
            return json.dumps(
                {"success": False, "error": "Solver has not finished yet"}
            )

        return controller.load_result()
