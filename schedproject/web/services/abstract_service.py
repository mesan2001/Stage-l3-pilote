import logging
from typing import TYPE_CHECKING, Any, TypeAlias
from typing import Optional

from services.database_service import Filter, FilterSet

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp
    from routes.abstract_routes import AbstractRoutes


class NoTableAttributed(Exception): ...


class TableAttributedNotFound(Exception): ...


logger = logging.getLogger(__name__)

ID: TypeAlias = str | int


class AbstractService:
    _table_name: str

    def __init__(
        self, app: "InterfacesWebApp", routes: Optional[type["AbstractRoutes"]] = None
    ) -> None:
        self.app = app
        self._view_name = self._get_view_name()
        self._init_routes(routes)

    def _init_routes(self, routes):
        if routes:
            self.routes = routes(self, self.app).commit_routes()
        else:
            self.routes = None

    def _get_view_name(self) -> str | None:
        try:
            vt_association = self.app.db_service.vt_association
            for view, table in vt_association.items():
                if table == self._table_name:
                    return view
        except Exception as e:
            logger.warning(f"Error getting view name for {self._table_name}: {str(e)}")
        return None

    def _get_read_source(self) -> str:
        return self._view_name if self._view_name else self._table_name

    def _get_write_source(self) -> str:
        return self._table_name

    def table_name(self) -> str:
        try:
            table_name = self._table_name
        except AttributeError as e:
            logger.error(
                f"Related table name have not been initialized for service {self.__class__.__name__}"
            )
            raise e

        if not self.app.db_service.table_exists(table_name):
            raise TableAttributedNotFound(f"Table {table_name} do not exist")

        return table_name

    def get_by_id(self, id: ID) -> dict[str, Any]:
        return self.app.db_service.get_record(
            table_name=self._get_read_source(), record_id=str(id)
        )

    def get_by_ids(self, ids: list[ID]) -> list[dict[str, Any]]:
        return self.app.db_service.get_records(
            table_name=self._get_read_source(), record_ids=ids
        )

    def get_all(self) -> list[dict[str, Any]]:
        return self.app.db_service.get_all_records(table_name=self._get_read_source())

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        return self.app.db_service.create_record(
            self._get_write_source(), self._validate(data)
        )

    def create_multiple(self, data: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return self.app.db_service.create_records(
            self._get_write_source(), list(map(self._validate, data))
        )

    def _validate(self, data: dict[str, Any]) -> dict[str, Any]:
        return data

    def update(self, id: ID, data: dict[str, Any]) -> dict[str, Any]:
        return self.app.db_service.update_record(
            self._get_write_source(), str(id), self._validate(data)
        )

    def delete(self, id: ID) -> bool:
        return self.app.db_service.delete_record(self._get_write_source(), str(id))

    def filter(
        self, filters: FilterSet | Filter | list[dict[Any, Any]] | dict[Any, Any]
    ) -> list[dict]:
        return self.app.db_service.filter_records(self._get_read_source(), filters)

    def get_columns(self) -> dict[str, dict]:
        try:
            table_info = self.app.db_service.get_table_info(self._get_read_source())
            return table_info["columns_info"]
        except Exception as e:
            logger.error(
                f"Error getting columns for table {self._get_read_source()}: {str(e)}"
            )
            raise e
