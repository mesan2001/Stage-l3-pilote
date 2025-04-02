import logging
import os
import sys
import time

import colorama
import requests
from flask import Flask, render_template

from flask_cors import CORS
from services import (
    DatabaseService,
    CoursesService,
    ModalitiesService,
    StudentsService,
    GroupsService,
    StepsService,
    ClassroomsService,
    CalendarsService,
    PeriodsService,
    LecturersService,
    RulesService,
    ClassesServices,
    SelectorsService,
    LabelsService,
    FiltersService,
    LecturerAssignmentsService,
    FormationsServices,
)
from services import UtilsService, ConfService

from utils.misc import generate_endpoints_summary
from routes.abstract_routes import AbstractRoutes

__all__ = ["InterfacesWebApp"]


logger = logging.getLogger(__name__)


colorama.init()


class ColorFormatter(logging.Formatter):
    COLORS = {
        "DEBUG": colorama.Fore.CYAN,
        "INFO": colorama.Fore.GREEN,
        "WARNING": colorama.Fore.YELLOW,
        "ERROR": colorama.Fore.RED,
        "CRITICAL": colorama.Fore.WHITE + colorama.Back.RED,
    }

    def format(self, record):
        color = self.COLORS.get(record.levelname, colorama.Fore.RESET)
        setattr(record, "relativepath", os.path.relpath(record.pathname))
        message = super().format(record)
        return f"{color}{message}{colorama.Fore.RESET}"


def setup_logging():
    handler = logging.StreamHandler()

    formatter = ColorFormatter(
        fmt="%(asctime)s | %(filename)s:%(lineno)d : %(message)s", datefmt="%H:%M:%S"
    )
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)

    root_logger.addHandler(handler)


setup_logging()


class InterfacesWebApp:

    def __init__(
        self,
        template_folder: str = "./template",
        static_folder: str = "./static",
        max_retries: int = 5,
        host: str = "http://localhost",
        port: int | str = 5000,
    ):

        retry_count = 0
        while retry_count < max_retries:
            try:
                logging.info(f"Trying to connect to {host}:{port}")

                response = requests.get(f"{host}:{port}/")
                if response.status_code != 200:
                    retry_count += 1
                    time.sleep(2)
                else:
                    break
            except Exception:

                retry_count += 1
                logging.info(
                    f"Trying to connect to {host}:{port} : failure {retry_count}/{max_retries}"
                )
                time.sleep(2)

        if retry_count == max_retries:
            logging.error("Failed to connect after maximum retries. Exiting...")
            sys.exit(1)

        logging.info("Connected successfully to the db")

        self.flask_app = Flask(
            "InterfacesWebApp",
            template_folder=os.path.join(os.getcwd(), template_folder),
            static_folder=os.path.join(os.getcwd(), static_folder),
        )
        CORS(self.flask_app)
        logger.info("Loading services...")

        # FIRST SERVICES
        self.conf_service = ConfService(self)
        self.utils_service = UtilsService(self)
        self.db_service = DatabaseService(self, host=host, port=port)
        self.db_service.init()

        transformation_occured, raw_tables = (
            self.db_service.get_data_transformation_information()
        )
        if not raw_tables:
            self.utils_service.populate_db()
            self.utils_service.get_transformation()

        if not transformation_occured:
            self.utils_service.get_transformation()

        self.formations_service = FormationsServices(self)

        self.calendars_service = CalendarsService(self)
        self.periods_service = PeriodsService(self)

        self.lecturers_service = LecturersService(self)
        self.lecturer_assignments_service = LecturerAssignmentsService(self)

        self.classrooms_service = ClassroomsService(self)

        self.courses_service = CoursesService(self)
        self.modalities_service = ModalitiesService(self)
        self.steps_service = StepsService(self)

        self.students_service = StudentsService(self)
        self.groups_service = GroupsService(self)
        self.classes_service = ClassesServices(self)

        self.selectors_service = SelectorsService(self)
        self.filters_service = FiltersService(self)
        self.rules_service = RulesService(self)

        # LAST SERVICE

        self.labels_service = LabelsService(self)

        # self.test = ServicesTests(self)
        # self.db_service.delete_all_tables_content()

        # self.test.run_all_tests()

        logger.info("Loading services done!")

        self.setup_routes()

    def run(self):
        generate_endpoints_summary(self.flask_app)

        self.flask_app.run(
            debug=False,
            port=8080,
            host="0.0.0.0",
        )

    def setup_routes(self):

        self.flask_app.register_blueprint(AbstractRoutes.INTERFACES_BLUEPRINT)

        @self.flask_app.route("/")
        def index():
            return render_template("index.html"), 200

        @self.flask_app.after_request
        def add_header(response):
            if response.headers["Content-Type"].startswith("text/javascript"):
                response.headers["Content-Type"] = "application/javascript"
            response.headers["Content-Security-Policy"] = "connect-src *;"
            return response
