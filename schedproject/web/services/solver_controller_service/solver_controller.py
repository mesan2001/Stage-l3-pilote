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

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

import logging

logger = logging.getLogger(__name__)


class SolverStatus(Enum):
    READY = 1
    PARSING = 2
    SOLVING = 3
    FINISHED = 4
    FAILED = 5


class SolverController:
    _id = 0
    PARSER_JAR = "solver/parser.jar"
    SOLVER_JAR = "solver/solver.jar"
    FEATURE_MODEL_DIR = "/web/solver/featuremodel/"

    INSTANCE_DATA_NAME = "metadata.json"

    def __init__(
        self,
        name: str,
        instance_path: str,
        strategy_path: str,
        status,
        decision_path: Optional[str] = None,
        statistics_path: Optional[str] = None,
        solution_path: Optional[str] = None,
        experiment_dir: Optional[str] = None,
    ) -> None:
        self.id = SolverController._id
        SolverController._id += 1
        self.name = name
        self.instance_path = instance_path
        self.strategy_path = strategy_path
        self.status = status
        self.decision_path = decision_path
        self.statistics_path = statistics_path
        self.solution_path = solution_path
        self.experiment_dir = experiment_dir
        self.working_dir: Optional[str] = None

        self.process: Optional[subprocess.Popen] = None

    @staticmethod
    def load(folder_path):
        if not os.path.exists(folder_path):
            raise FileExistsError(f"Instance folder do not found : {folder_path}")
        data_path = os.path.join(folder_path, SolverController.INSTANCE_DATA_NAME)
        with open(data_path, "r") as f:
            data = json.loads(f.read())
            _data = data

        name = data["name"]

        instance_path = data["instance_path"]
        if not os.path.exists(instance_path):
            raise FileExistsError(f"Instance file not found : {instance_path}")
        instance_path = instance_path

        strategy_path = data["strategy_path"]
        if not os.path.exists(strategy_path):
            raise FileExistsError(f"Strategy file not found : {strategy_path}")
        strategy_path = strategy_path

        status = data["status"]

        decision_path = data.get("decision_path", None)
        statistics_path = data.get("statistics_path", None)
        solution_path = data.get("solution_path", None)
        experiment_dir = data.get("experiment_dir", None)

        controller = SolverController(
            name=name,
            instance_path=instance_path,
            strategy_path=strategy_path,
            status=status,
            decision_path=decision_path,
            statistics_path=statistics_path,
            solution_path=solution_path,
            experiment_dir=experiment_dir,
        )
        controller.working_dir = folder_path
        return controller

    @staticmethod
    def create_new(
        name: str,
        instance_folder: str,
        instance_file_content: dict,
        strategy_file_content: dict,
    ):
        instance_id = str(uuid.uuid4())
        instance_folder = os.path.join(instance_folder, instance_id)

        os.makedirs(instance_folder, exist_ok=True)

        instance_filename = "instance.json"
        strategy_filename = "strategy.json"

        instance_dest = os.path.join(instance_folder, instance_filename)
        strategy_dest = os.path.join(instance_folder, strategy_filename)

        with open(instance_dest, "w") as f:
            json.dump(instance_file_content, f, indent=2)

        with open(strategy_dest, "w") as f:
            json.dump(strategy_file_content, f, indent=2)

        controller = SolverController(
            name=name,
            instance_path=instance_dest,
            strategy_path=strategy_dest,
            status=SolverStatus.READY.name,
        )
        controller.working_dir = instance_folder

        controller_data = {
            "name": name,
            "instance_path": instance_dest,
            "strategy_path": strategy_dest,
            "status": SolverStatus.READY.name,
            "decision_path": None,
            "statistics_path": None,
            "solution_path": None,
            "experiment_dir": None,
        }

        data_path = os.path.join(instance_folder, SolverController.INSTANCE_DATA_NAME)
        with open(data_path, "w") as f:
            json.dump(controller_data, f, indent=2)

        return controller

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "instance_path": self.instance_path,
            "strategy_path": self.strategy_path,
            "status": self.status,
            "decision_path": self.decision_path,
            "statistics_path": self.statistics_path,
            "solution_path": self.solution_path,
            "experiment_dir": self.experiment_dir,
            "working_dir": self.working_dir,
        }

    def load_result(self):
        results = {}

        if self.decision_path and os.path.exists(self.decision_path):
            try:
                with open(self.decision_path, "r") as f:
                    results["decision_path"] = f.read()
            except Exception as e:
                results["decision_path_error"] = str(e)

        if self.statistics_path and os.path.exists(self.statistics_path):
            try:
                with open(self.statistics_path, "r") as f:
                    results["statistics"] = f.read()
            except Exception as e:
                results["statistics_error"] = str(e)
        if self.solution_path and os.path.exists(self.solution_path):
            try:
                with open(self.solution_path, "r") as f:
                    results["solution"] = f.read()
            except Exception as e:
                results["solution_error"] = str(e)

        return results

    def _find_and_save_output_paths(self):
        if not self.working_dir:
            logger.error("Working directory not set")
            return {}

        try:
            tmp_dir = os.path.join(self.working_dir, "tmp")
            if not os.path.exists(tmp_dir):
                logger.error(f"tmp directory not found in {self.working_dir}")
                return {}

            experiment_dirs = [
                d
                for d in os.listdir(tmp_dir)
                if os.path.isdir(os.path.join(tmp_dir, d))
                and d.startswith("experiment_")
            ]

            logger.info(experiment_dirs)

            if not experiment_dirs:
                logger.error(f"No experiment directories found in {tmp_dir}")
                return {}

            latest_dir = max(
                experiment_dirs,
                key=lambda d: os.stat(os.path.join(tmp_dir, d)).st_mtime,
            )

            logger.info(latest_dir)

            self.experiment_dir = os.path.join(tmp_dir, latest_dir)
            logger.info(f"Found latest experiment directory: {self.experiment_dir}")

            solution_files = [
                f for f in os.listdir(self.experiment_dir) if f.startswith("solution_")
            ]

            if not solution_files:
                logger.error(f"No solution files found in {self.experiment_dir}")
                return {}

            solution_dir = os.path.join(self.working_dir, "solution")
            os.makedirs(solution_dir, exist_ok=True)

            tmp_decision_path = None
            tmp_statistics_path = None
            tmp_solution_path = None

            for file in solution_files:
                file_path = os.path.join(self.experiment_dir, file)
                if file.endswith("-decision_path.txt"):
                    tmp_decision_path = file_path
                elif file.endswith("-statistics_solver.csv"):
                    tmp_statistics_path = file_path
                elif file.endswith(".xml"):
                    tmp_solution_path = file_path

            if tmp_decision_path:
                self.decision_path = os.path.join(solution_dir, "decision_path.txt")
                shutil.copy2(tmp_decision_path, self.decision_path)
                logger.info(f"Copied decision path to {self.decision_path}")

            if tmp_statistics_path:
                self.statistics_path = os.path.join(solution_dir, "statistics.csv")
                shutil.copy2(tmp_statistics_path, self.statistics_path)
                logger.info(f"Copied statistics to {self.statistics_path}")

            if tmp_solution_path:
                self.solution_path = os.path.join(solution_dir, "result.json")
                shutil.copy2(tmp_solution_path, self.solution_path)
                logger.info(
                    f"Copied solution to {self.solution_path} (renamed from .xml to .json)"
                )

            logger.info(f"Solution files copied to {solution_dir}")

            try:
                logger.info(f"Cleaning up temporary directory: {tmp_dir}")
                shutil.rmtree(tmp_dir)
                logger.info(f"Successfully removed temporary directory")
            except Exception as e:
                logger.warning(f"Failed to remove temporary directory: {str(e)}")

        except Exception as e:
            logger.error(f"Error finding and copying result files: {str(e)}")
            return {}

    def run(self):
        if self.status in [SolverStatus.PARSING.name, SolverStatus.SOLVING.name]:
            return False

        if not self.working_dir or not os.path.exists(self.working_dir):
            logger.error(f"Working directory does not exist: {self.working_dir}")
            self.status = SolverStatus.FAILED.name
            self.save()
            return False
        try:
            parser_dest = os.path.join(
                self.working_dir, os.path.basename(self.PARSER_JAR)
            )
            solver_dest = os.path.join(
                self.working_dir, os.path.basename(self.SOLVER_JAR)
            )

            shutil.copy2(self.PARSER_JAR, parser_dest)
            shutil.copy2(self.SOLVER_JAR, solver_dest)
        except Exception as e:
            logger.error(f"Error copying JAR files: {str(e)}")
            self.status = SolverStatus.FAILED.name
            self.save()
            return False

        threading.Thread(target=self._process_thread, daemon=True).start()

        self.status = SolverStatus.PARSING.name
        self.save()
        return True

    def _process_thread(self):
        try:
            logger.info(f"Starting parsing for {self.name} (ID: {self.id})")
            if not self.working_dir:
                raise ValueError(
                    "It seesm that SolverCOntroller habe not been succesfully initialized"
                )

            parser_cmd = [
                "java",
                "-jar",
                os.path.join(self.working_dir, os.path.basename(self.PARSER_JAR)),
                self.instance_path,
            ]
            logger.info(f"Parser command: {' '.join(parser_cmd)}")

            self.process = subprocess.Popen(
                parser_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
            )

            stdout, stderr = self.process.communicate()

            if self.process.returncode != 0:
                logger.error(f"Parsing failed for {self.name}: {stderr.decode()}")
                self.status = SolverStatus.FAILED.name
                self.save()
                self.process = None
                return

            logger.info(f"Parsing completed for {self.name}")

            self.status = SolverStatus.SOLVING.name
            self.save()

            logger.info(f"Starting solving for {self.name} (ID: {self.id})")

            try:
                base_filename = os.path.basename(self.instance_path)
                base_path = os.path.splitext(base_filename)[0]
                extension = os.path.splitext(base_filename)[1]
                pattern = f"{base_path}?*{extension}"

                re_parsed_intance = os.path.join(self.working_dir, pattern)

                files = glob(re_parsed_intance)

                parsed_output = max(files, key=lambda x: os.stat(x).st_mtime)

                parsed_output_path = parsed_output
            except Exception as e:
                logger.error(
                    f"An error occured while identifying {self.name} parsing output: {e}"
                )
                self.status = SolverStatus.FAILED.name
                self.save()
                self.process = None
                return

            solver_cmd = [
                "java",
                "-jar",
                os.path.join(self.working_dir, os.path.basename(self.SOLVER_JAR)),
                parsed_output,
                self.instance_path,
                self.strategy_path,
                SolverController.FEATURE_MODEL_DIR,
            ]
            logger.info(f"Solver command: {' '.join(solver_cmd)}")

            self.process = subprocess.Popen(
                solver_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.working_dir,
            )

            stdout, stderr = self.process.communicate()

            try:
                if os.path.exists(parsed_output_path):
                    os.remove(parsed_output_path)
                    logger.debug(f"Removed parsed output file: {parsed_output_path}")
            except Exception as e:
                logger.error(f"Error removing parsed output file: {str(e)}")

            if self.process.returncode != 0:
                logger.error(f"Solving failed for {self.name}: {stderr.decode()}")
                self.status = SolverStatus.FAILED.name
                self.save()
                self.process = None
                return

            logger.info(f"Solving completed for {self.name}")

            self._find_and_save_output_paths()
            self.status = SolverStatus.FINISHED.name
            self.save()

        except Exception as e:
            logger.error(f"Error in processing thread for {self.name}: {str(e)}")
            self.status = SolverStatus.FAILED.name
            self.save()
        finally:
            self.process = None
            self._cleanup_jars()

    def _cleanup_jars(self):
        if self.working_dir:
            parser_jar = os.path.join(
                self.working_dir, os.path.basename(self.PARSER_JAR)
            )
            solver_jar = os.path.join(
                self.working_dir, os.path.basename(self.SOLVER_JAR)
            )

            try:
                if os.path.exists(parser_jar):
                    os.remove(parser_jar)
                    logger.debug(f"Removed parser JAR: {parser_jar}")

                if os.path.exists(solver_jar):
                    os.remove(solver_jar)
                    logger.debug(f"Removed solver JAR: {solver_jar}")
            except Exception as e:
                logger.error(f"Error removing JAR files: {str(e)}")

    def stop(self):

        if self.process and self.status == SolverStatus.SOLVING.name:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()

            self.status = SolverStatus.FAILED.name
            self.save()
            self.process = None
            self._cleanup_jars()
            return True
        self._cleanup_jars()
        return False

    def save(self):
        if not self.working_dir:
            return

        data_path = os.path.join(self.working_dir, SolverController.INSTANCE_DATA_NAME)

        try:
            with open(data_path, "r") as f:
                data = json.load(f)

            data["name"] = self.name
            data["instance_path"] = self.instance_path
            data["strategy_path"] = self.strategy_path
            data["status"] = self.status
            data["decision_path"] = self.decision_path
            data["statistics_path"] = self.statistics_path
            data["solution_path"] = self.solution_path
            data["experiment_dir"] = self.experiment_dir

            with open(data_path, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logging.error(f"Error updating status: {str(e)}")
