import logging
from services.abstract_service import ID, AbstractService
from typing import TYPE_CHECKING

from routes.courses_routes import CoursesRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class CoursesService(AbstractService):
    _table_name = "courses"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, CoursesRoutes)

    def get_courses_by_step(self, step_id: ID) -> list[dict]:
        query = """
            SELECT c.*
            FROM courses c
            JOIN step_course_junction scj ON c.id = scj.course_id
            WHERE scj.step_id = %s
        """

        try:
            results = self.app.db_service.execute_query(query, [step_id])
            return results
        except Exception as e:
            logging.error(f"Error retrieving courses for step {step_id}: {str(e)}")
            raise

    def get_courses_by_formation(self, formation_id: ID) -> list[dict]:

        steps_query = """
            SELECT id FROM steps
            WHERE formation_id = %s
        """

        try:
            steps = self.app.db_service.execute_query(steps_query, [formation_id])

            if not steps:
                return []

            step_ids = [step["id"] for step in steps]

            courses_query = """
                SELECT DISTINCT c.*
                FROM courses c
                JOIN step_course_junction scj ON c.id = scj.course_id
                WHERE scj.step_id = ANY(%s)
            """

            courses = self.app.db_service.execute_query(courses_query, [step_ids])
            return courses

        except Exception as e:
            logging.error(
                f"Error retrieving courses for formation {formation_id}: {str(e)}"
            )
            raise
