from services.abstract_service import AbstractService
from faker import Faker
from typing import TYPE_CHECKING, Optional
import logging

from routes import StudentsRoutes
from services.database_service import ID

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class StudentsService(AbstractService):
    _table_name = "students"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, StudentsRoutes)
        self.generate_students(80, formation="TL3IN11")

    def get_students_by_courses(self, course_ids: list[ID]):
        placeholder = ",".join(["%s"] * len(course_ids))
        query = f"""
        SELECT DISTINCT students.* FROM students
        JOIN student_course_junction ON students.id = student_course_junction.student_id
        WHERE student_course_junction.course_id IN ({placeholder})
        """

        return self.app.db_service.execute_query(query, course_ids, awaits_result=True)

    def generate_students(
        self,
        nb_students: int,
        formation: Optional[str] = None,
        step: Optional[int] = None,
        course: Optional[int] = None,
    ):
        faker = Faker("fr_FR")
        students = self.create_multiple(
            [{"name": faker.name()} for _ in range(nb_students)]
        )
        students_id = [s["id"] for s in students]
        courses = []
        if formation:
            courses.extend(self.app.courses_service.get_courses_by_formation(formation))
        if step:
            courses.extend(self.app.courses_service.get_courses_by_step(step))
        if course:
            courses.extend(self.app.courses_service.get_by_id(course))

        courses_id = list(set([c["id"] for c in courses]))

        query = ""
        placeholders = []
        values_str = []
        for student_id in students_id:
            for course_id in courses_id:
                values_str.append("(%s, %s)")
                placeholders.extend([student_id, course_id])

        if values_str:
            query = (
                "INSERT INTO student_course_junction (student_id, course_id) VALUES "
                + ", ".join(values_str)
            )
        else:
            query = ""

        self.app.db_service.execute_query(query, placeholders, awaits_result=False)

        if not (formation or step):
            return

        formation_name = ""

        if formation:
            formation_name = self.app.formations_service.get_by_id(formation)["name"]

        if step:
            formation_name_by_step = (
                self.app.formations_service.get_formation_given_step(step)["name"]
            )
            if formation and formation_name != formation_name_by_step:
                return

        if not formation_name:
            return

        query = ""
        placeholders = []
        values_str = []
        for student_id in students_id:

            values_str.append("(%s, %s, %s, %s)")
            placeholders.extend(["students", student_id, "formation", formation_name])

        if values_str:
            query = (
                "INSERT INTO custom_labels (resource_type, resource_id, label_key, label) VALUES "
                + ", ".join(values_str)
            )
        else:
            query = ""

        self.app.db_service.execute_query(query, placeholders, awaits_result=False)
