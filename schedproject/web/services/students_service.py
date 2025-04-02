from services.abstract_service import AbstractService
from faker import Faker
from typing import TYPE_CHECKING
import logging

from routes.students_routes import StudentsRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp

logger = logging.getLogger(__name__)


class StudentsService(AbstractService):
    _table_name = "students"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, StudentsRoutes)

    #     self.faker = Faker()

    # def generate_students(self, program_id: int, num_students: int) -> list[dict]:
    #     try:
    #         program = self.app.programs_service.get_by_id(program_id)
    #         if not program:
    #             raise ValueError(f"Program with ID {program_id} not found")

    #         created_students = []

    #         for _ in range(num_students):
    #             student_data = {"name": self.faker.name(), "program_id": program_id}

    #             created_student = self.create(student_data)
    #             created_students.append(created_student)

    #             logger.debug(f"Created student: {created_student}")

    #         logger.info(
    #             f"Successfully generated {len(created_students)} students for program {program['name']}"
    #         )
    #         return created_students

    #     except Exception as e:
    #         logger.error(f"Error generating students: {str(e)}")
    #         raise e

    # def get_students_by_program(self, program_id: int) -> list[dict]:
    #     try:
    #         program = self.app.programs_service.get_by_id(program_id)
    #         if not program:
    #             raise ValueError(f"Program with ID {program_id} not found")

    #         students = self.app.db_service.execute_query(
    #             "SELECT * FROM students WHERE program_id = %s", [program_id]
    #         )

    #         return students

    #     except Exception as e:
    #         logger.error(f"Error getting students for program {program_id}: {str(e)}")
    #         raise e

    # def get_program_students_without_group(self, program_id: int) -> list[dict]:

    #     try:
    #         program = self.app.programs_service.get_by_id(program_id)
    #         if not program:
    #             raise ValueError(f"Program with ID {program_id} not found")

    #         query = """
    #         SELECT s.* FROM students s
    #         WHERE s.program_id = %s
    #         AND NOT EXISTS (
    #             SELECT 1 FROM student_group_junction sgj
    #             JOIN groups g ON sgj.group_id = g.id
    #             WHERE sgj.student_id = s.id AND g.program_id = %s
    #         )
    #         """

    #         students = self.app.db_service.execute_query(
    #             query, [program_id, program_id]
    #         )

    #         return students

    #     except Exception as e:
    #         logger.error(
    #             f"Error getting students without groups for program {program_id}: {str(e)}"
    #         )
    #         raise e
