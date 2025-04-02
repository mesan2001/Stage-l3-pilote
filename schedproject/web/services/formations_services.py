import logging
from services.abstract_service import ID, AbstractService

from typing import TYPE_CHECKING, Any

from routes.formations_routes import FormationsRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class FormationsServices(AbstractService):
    _table_name = "formations"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, FormationsRoutes)

    def get_formation_content(self, formation_id: ID) -> dict[str, Any]:

        try:
            formation_query = """
                SELECT * FROM formations
                WHERE id = %s
            """
            formation_result = self.app.db_service.execute_query(
                formation_query, [formation_id]
            )

            if not formation_result:
                return {}

            formation_data = dict(formation_result[0])

            steps_query = """
                SELECT * FROM steps
                WHERE formation_id = %s
            """
            steps = self.app.db_service.execute_query(steps_query, [formation_id])

            steps_data = []
            for step in steps:
                step_data = dict(step)
                courses_query = """
                    SELECT c.*
                    FROM courses c
                    JOIN step_course_junction scj ON c.id = scj.course_id
                    WHERE scj.step_id = %s
                """
                courses = self.app.db_service.execute_query(courses_query, [step["id"]])

                course_list = []
                for course in courses:
                    course_data = dict(course)

                    modalities_query = """
                        SELECT *
                        FROM modalities
                        WHERE course_id = %s
                    """
                    modalities = self.app.db_service.execute_query(
                        modalities_query, [course["id"]]
                    )

                    course_data["modalities"] = modalities
                    course_list.append(course_data)

                step_data["courses"] = course_list
                steps_data.append(step_data)

            formation_data["steps"] = steps_data

            return formation_data

        except Exception as e:
            logging.error(
                f"Error retrieving formation content for formation {formation_id}: {str(e)}"
            )
            raise

    def get_formations_given_course(self, course_id: ID) -> list[dict[str, Any]]:
        if not self.app.courses_service.get_by_id(course_id):
            raise ValueError(f"Course with ID {course_id} not found")

        junction_query = """
            SELECT step_id
            FROM step_course_junction
            WHERE course_id = %s
        """
        steps_junctions = self.app.db_service.execute_query(junction_query, [course_id])

        if not steps_junctions:
            raise ValueError(f"Course {course_id} is not associated with any steps")

        step_ids = [junction["step_id"] for junction in steps_junctions]

        formations_query = """
            SELECT DISTINCT f.*
            FROM formations f
            JOIN steps s ON f.id = s.formation_id
            WHERE s.id = ANY(%s)
        """
        formations = self.app.db_service.execute_query(formations_query, [step_ids])

        if not formations:
            raise ValueError(f"No formations found containing course {course_id}")

        return formations
