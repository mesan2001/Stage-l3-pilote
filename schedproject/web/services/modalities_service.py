from services.abstract_service import AbstractService
from typing import TYPE_CHECKING
from services.database_service import ID, equals
from routes import ModalitiesRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ModalitiesService(AbstractService):
    _table_name = "modalities"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, ModalitiesRoutes)

    def get_modalities_by_course(self, course_id: str | int) -> list[dict]:
        filters = equals("course_id", course_id)
        return self.filter(filters)

    def get_modalities_by_step(self, step_id: int) -> list[dict]:
        query = """
        SELECT modalities.* FROM modalities
        JOIN courses ON modalities.course_id = courses.id
        JOIN steps ON courses.step_id = steps.id
        WHERE steps.id = %s
        """
        placeholder = [step_id]

        modalities = self.app.db_service.execute_query(
            query=query, params=placeholder, awaits_result=True
        )
        return modalities

    def get_modality_headcount(self, modality_id: ID):
        # TODO : optimize
        classes = self.app.classes_service.filter(equals("modality_id", modality_id))
        if classes:
            return sum([c["headcount"] for c in classes])
        raise ValueError("No classes linked to the modality")
