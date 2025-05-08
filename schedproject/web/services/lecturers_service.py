from services.abstract_service import AbstractService

from typing import TYPE_CHECKING, Any, Optional

from services.database_service import FilterSet, equals
from routes import LecturerAssignmentsRoutes, LecturersRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class LecturersService(AbstractService):
    _table_name = "lecturers"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, LecturersRoutes)


class LecturerAssignmentsService(AbstractService):
    _table_name = "lecturer_assignments"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, LecturerAssignmentsRoutes)

    def get_by_lecturer_id(self, lecturer_id: int) -> list[dict[str, Any]]:
        return self.filter(equals("lecturer_id", lecturer_id))

    def get_by_course_id(self, course_id: int) -> list[dict[str, Any]]:
        return self.filter(equals("course_id", course_id))

    def get_by_modality_id(self, modality_id: int) -> list[dict[str, Any]]:
        return self.filter(equals("modality_id", modality_id))

    def get_assignments_by_multiple_criteria(
        self,
        lecturer_id: Optional[int] = None,
        course_id: Optional[int] = None,
        modality_id: Optional[int] = None,
    ) -> list[dict[str, Any]]:

        filters = FilterSet()

        if lecturer_id is not None:
            filters.add(equals("lecturer_id", lecturer_id))

        if course_id is not None:
            filters.add(equals("course_id", course_id))

        if modality_id is not None:
            filters.add(equals("modality_id", modality_id))

        if len(filters) == 0:
            return self.get_all()

        return self.filter(filters)

    def delete_lecturer_assignments(self, lecturer_id: int) -> None:
        assignments = self.get_by_lecturer_id(lecturer_id)
        for assignment in assignments:
            self.delete(assignment["id"])
