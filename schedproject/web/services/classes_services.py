from services.abstract_service import AbstractService, logger
from typing import TYPE_CHECKING

from routes.classes_routes import ClassesRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class ClassesServices(AbstractService):
    _table_name = "classes"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app)
        self.routes = ClassesRoutes(self, app)

    def add_modalities_to_class(self, class_id: int, modality_ids: list[int]) -> bool:
        try:
            query = """
                INSERT INTO class_modality_junction (class_id, modality_id)
                SELECT %s, unnest(%s::integer[])
                ON CONFLICT DO NOTHING
            """
            self.app.db_service.execute_query(
                query, [class_id, modality_ids], awaits_result=False
            )
            return True
        except Exception as e:
            logger.error(f"Error adding modalities to class: {str(e)}")
            raise e

    def remove_modality_from_class(self, class_id: int, modality_id: int) -> bool:
        try:
            query = """
                DELETE FROM class_modality_junction
                WHERE class_id = %s AND modality_id = %s
            """
            self.app.db_service.execute_query(
                query, [class_id, modality_id], awaits_result=False
            )
            return True
        except Exception as e:
            logger.error(f"Error removing modality from class: {str(e)}")
            raise e

    def get_class_modalities(self, class_id: int) -> list[dict]:
        try:
            query = """
                SELECT m.*
                FROM modalities m
                JOIN class_modality_junction cmj ON m.id = cmj.modality_id
                WHERE cmj.class_id = %s
            """
            return self.app.db_service.execute_query(query, [class_id])
        except Exception as e:
            logger.error(f"Error getting class modalities: {str(e)}")
            raise e

    def add_groups_to_class(self, class_id: int, group_ids: list[int]) -> bool:
        try:
            query = """
                INSERT INTO group_class_junction (class_id, group_id)
                SELECT %s, unnest(%s::integer[])
                ON CONFLICT DO NOTHING
            """
            self.app.db_service.execute_query(
                query, [class_id, group_ids], awaits_result=False
            )
            return True
        except Exception as e:
            logger.error(f"Error adding groups to class: {str(e)}")
            raise e

    def remove_group_from_class(self, class_id: int, group_id: int) -> bool:
        try:
            query = """
                DELETE FROM group_class_junction
                WHERE class_id = %s AND group_id = %s
            """
            self.app.db_service.execute_query(
                query, [class_id, group_id], awaits_result=False
            )
            return True
        except Exception as e:
            logger.error(f"Error removing group from class: {str(e)}")
            raise e

    def get_class_groups(self, class_id: int) -> list[dict]:
        try:
            query = """
                SELECT g.*
                FROM groups g
                JOIN group_class_junction gcj ON g.id = gcj.group_id
                WHERE gcj.class_id = %s
            """
            return self.app.db_service.execute_query(query, [class_id])
        except Exception as e:
            logger.error(f"Error getting class groups: {str(e)}")
            raise e

    def get_classes_by_modality(self, modality_id: int) -> list[dict]:
        try:
            query = """
                SELECT c.*
                FROM classes c
                JOIN class_modality_junction cmj ON c.id = cmj.class_id
                WHERE cmj.modality_id = %s
            """
            return self.app.db_service.execute_query(query, [modality_id])
        except Exception as e:
            logger.error(f"Error getting classes by modality: {str(e)}")
            raise e

    def delete_class(self, class_id: int) -> bool:
        try:
            self.app.db_service.execute_query(
                "DELETE FROM group_class_junction WHERE class_id = %s",
                [class_id],
                awaits_result=False,
            )
            self.app.db_service.execute_query(
                "DELETE FROM class_modality_junction WHERE class_id = %s",
                [class_id],
                awaits_result=False,
            )

            return self.delete(class_id)
        except Exception as e:
            logger.error(f"Error deleting class: {str(e)}")
            raise e
