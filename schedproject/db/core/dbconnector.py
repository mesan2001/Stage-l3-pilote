import logging
import psycopg
import time

from abc import ABC, abstractmethod
from typing import Any

from psycopg import OperationalError
from psycopg.rows import dict_row

from .utils import analyze_json

logger = logging.getLogger(__name__)


class DBConnector(ABC):
    @abstractmethod
    def execute_query(
        self,
        query: str,
        placeholders: list[Any] | None = None,
        awaits_result: bool = False,
    ) -> list[dict] | None:
        pass

    @abstractmethod
    def close_connection(self) -> None:
        pass

    @abstractmethod
    def table_exists(self, table_name: str) -> bool:
        pass

    @staticmethod
    def _analyse_json(json_data: Any):
        return analyze_json(json_data, text_only=True)


class PostgresqlDBConnector(DBConnector):
    def __init__(
        self,
        user: str,
        password: str,
        host: str,
        port: str,
        database: str = "postgres",
    ):
        super()
        self.user = user
        self.password = password
        self.host = host
        self.port = port
        self.database = database

        while not self._connect():
            time.sleep(1)

    def _connect(self):
        try:

            with psycopg.connect(
                user=self.user, password=self.password, host=self.host, port=self.port
            ) as conn:
                conn.autocommit = True
                with conn.cursor() as cur:
                    cur.execute(
                        f"""
                        SELECT datname FROM pg_catalog.pg_database WHERE datname = '{self.database}';
                        """
                    )
                    if len(cur.fetchall()) == 0:
                        cur.execute(
                            f"""
                            CREATE DATABASE {self.database};
                            """
                        )

            self.connection = psycopg.connect(
                user=self.user,
                password=self.password,
                host=self.host,
                port=self.port,
                dbname=self.database,
            )
            logger.info(
                f"Connected to database {self.host}:{self.port}/{self.database} as {self.user}"
            )
            return True
        except OperationalError as e:
            logger.info(f"The error '{e}' occurred")
            return False

    def execute_query(
        self,
        query: str,
        placeholders: list[Any] | None = None,
        awaits_result: bool = False,
    ) -> list[dict] | None:
        cursor = self.connection.cursor(row_factory=dict_row)
        try:
            if placeholders:
                cursor.execute(query, placeholders)
            else:
                cursor.execute(query)

            if awaits_result:
                rows = cursor.fetchall()
                ret = [dict(row) for row in rows]
            else:
                ret = None
            self.connection.commit()

        except Exception as e:
            self.connection.commit()
            cursor.close()
            raise e

        cursor.close()
        return ret

    def close_connection(self):
        if self.connection:
            self.connection.close()
            logger.info(
                f"Connection to database {self.host}:{self.port}/{self.database} as {self.user} closed"
            )

    def table_exists(self, table_name: str) -> bool:
        query = f"""
        SELECT EXISTS (
            SELECT FROM
                information_schema.tables
            WHERE
                table_schema LIKE 'public' AND
                table_type LIKE 'BASE TABLE' AND
                table_name = '{table_name}'
            );
        """

        ret = self.execute_query(awaits_result=True, query=query)
        if ret is not None:
            return len(ret) > 0
        return False
