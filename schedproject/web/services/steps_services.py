from services.abstract_service import ID, AbstractService

from typing import TYPE_CHECKING, Any

from routes.steps_routes import StepsRoutes
from services.database_service import equals

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class StepsService(AbstractService):
    _table_name = "steps"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, StepsRoutes)

    def get_steps_given_formation(self, formation_id: ID):
        if not self.app.formations_service.get_by_id(formation_id):
            raise ValueError(f"Did not found formation {formation_id}")

        result = self.filter(equals("formation_id", formation_id))
        if not result:
            raise ValueError(f"Did not found steps for formation {formation_id}")

        return result

    def get_steps_given_course(self, course_id: ID) -> list[dict[str, Any]]:
        if not self.app.courses_service.get_by_id(course_id):
            raise ValueError(f"Course with ID {course_id} not found")

        junctions = self.app.db_service.filter_records(
            "step_course_junction", {"course_id": course_id}
        )

        if not junctions:
            raise ValueError(f"No steps found for course {course_id}")

        step_ids = [junction["step_id"] for junction in junctions]

        steps = []
        for step_id in step_ids:
            step = self.get_by_id(step_id)
            if step:
                steps.append(step)

        if not steps:
            raise ValueError(f"No valid steps found for course {course_id}")

        return steps
