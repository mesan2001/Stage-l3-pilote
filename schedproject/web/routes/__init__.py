from routes.abstract_routes import AbstractRoutes
from routes.calendars_routes import CalendarsRoutes
from routes.classrooms_routes import ClassroomsRoutes
from routes.courses_routes import CoursesRoutes
from routes.groups_routes import GroupsRoutes
from routes.lecturers_routes import LecturersRoutes, LecturerAssignmentsRoutes
from routes.modalities_routes import ModalitiesRoutes
from routes.formations_routes import FormationsRoutes
from routes.rules_routes import RulesRoutes, SelectorsRoutes, FiltersRoutes
from routes.steps_routes import StepsRoutes
from routes.students_routes import StudentsRoutes
from routes.classes_routes import ClassesRoutes
from routes.calendars_routes import PeriodsRoutes
from routes.labels_routes import LabelsRoutes


__all__ = [
    "AbstractRoutes",
    "CalendarsRoutes",
    "ClassroomsRoutes",
    "CoursesRoutes",
    "GroupsRoutes",
    "LecturersRoutes",
    "LecturerAssignmentsRoutes",
    "ModalitiesRoutes",
    "FormationsRoutes",
    "RulesRoutes",
    "SelectorsRoutes",
    "FiltersRoutes",
    "StepsRoutes",
    "StudentsRoutes",
    "ClassesRoutes",
    "PeriodsRoutes",
    "LabelsRoutes",
]
