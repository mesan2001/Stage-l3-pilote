from abc import ABC, abstractmethod
from typing import Any


from ..databridging import StageConfiguration


class AbstractController(ABC):
    @abstractmethod
    def create_table(
        self,
        table_name: str,
        json_list: Any | list[Any],
        primary_key: str | None = None,
    ) -> int:
        pass

    @abstractmethod
    def insert(self, table_name: str, json_data: Any | list[Any]) -> int:
        pass

    @abstractmethod
    def tables(self, database: str) -> list[str]:
        pass

    @abstractmethod
    def views(self) -> list[str]:
        pass

    @abstractmethod
    def transactions_tables(self) -> list[str]:
        pass

    @abstractmethod
    def process_data_transformation(self, configs: list[StageConfiguration]) -> None:
        pass

    @abstractmethod
    def query(
        self,
        database: str,
        query: str,
        placeholders: list[Any] | None = None,
        awaits_result: bool = True,
    ) -> list[dict]:
        pass

    @abstractmethod
    def view_table_association(self) -> dict[str, str]:
        pass

    @abstractmethod
    def get_transformation_occured(self) -> bool:
        pass
