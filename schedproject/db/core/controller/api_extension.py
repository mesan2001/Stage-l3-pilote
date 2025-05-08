import json
import logging

from flask import Flask, Response, jsonify, request
from psycopg.errors import DuplicateTable, UndefinedTable

from .abstract_controller import AbstractController
from ..databridging import StageConfiguration, StageConfigurationCycle
from ..utils import InchoherentStructure, InconsistentStructure, InvalidDatabaseName


class InvalidTableName(Exception): ...


class NoJsonDataProvided(Exception): ...


class TableNotFoundError(Exception): ...


class QueryRequired(Exception): ...


logger = logging.getLogger(__name__)


class APIExtension(AbstractController):

    def __init__(self, host="0.0.0.0", debug=True) -> None:
        logger.info("Initializing APIExtension")
        self.app = Flask("APIControllers")
        self.host = host
        self.debug = False
        self._setup_routes()

    def _setup_routes(self):
        logger.info("Setting up routes")

        @self.app.route("/create_table/fromjson/<table_name>", methods=["POST"])
        def route_create_table(table_name):
            logger.info(f"Received request to create table: {table_name}")
            try:
                nb_row_inserted = self.create_table(
                    table_name,
                    request.json,
                    request.args.get("primary_key", default="", type=str),
                )

                logger.info(
                    f"Table {table_name} created successfully with {nb_row_inserted} rows inserted"
                )
                return (
                    jsonify(
                        {
                            "message": f"Table {table_name} created successfully and inserted {nb_row_inserted} rows"
                        }
                    ),
                    201,
                )
            except InvalidTableName:
                logger.error(f"Invalid table name: {table_name}")
                return jsonify({"error": "Invalid table name"}), 400
            except NoJsonDataProvided:
                logger.error("No JSON data provided")
                return jsonify({"error": "No JSON data provided"}), 400
            except InchoherentStructure:
                logger.error("Incoherent data structure")
                return jsonify({"error": "incoherent data structure"}), 400
            except DuplicateTable:
                logger.error(f"Table {table_name} already exists")
                return (
                    jsonify({"error": "Table already exist"}),
                    400,
                )

        @self.app.route("/insert/fromjson/<table_name>", methods=["POST"])
        def route_insert(table_name):
            logger.info(f"Received request to insert into table: {table_name}")
            try:
                nb_row_inserted = self.insert(
                    table_name,
                    request.json,
                )

                logger.info(f"Inserted {nb_row_inserted} rows into table {table_name}")
                return (
                    jsonify(
                        {
                            "message": f"Inserted {nb_row_inserted} rows in table {table_name}"
                        }
                    ),
                    201,
                )
            except InvalidTableName:
                logger.error(f"Invalid table name: {table_name}")
                return jsonify({"error": "Invalid table name"}), 400
            except NoJsonDataProvided:
                logger.error("No JSON data provided")
                return jsonify({"error": "No JSON data provided"}), 400
            except InconsistentStructure as e:
                logger.error(f"Inconsistent data structure: {e.comparison}")
                return (
                    jsonify(
                        {"error": "Inconsitent data structure", "info": e.comparison}
                    ),
                    400,
                )
            except DuplicateTable:
                logger.error(f"Table {table_name} already exists")
                return (
                    jsonify({"error": "Table already exist"}),
                    400,
                )

        @self.app.route("/data_transformation")
        def route_data_transformation_all():
            logger.info("Received request for data transformation (all)")
            configs = StageConfiguration.get_all_configs_in_folder()
            try:
                self.process_data_transformation(configs)
            except StageConfigurationCycle:
                logger.error("Found cycle in data transformation configuration files")
                return (
                    jsonify(
                        {
                            "error": "Found cycle in data transformation configuration files"
                        }
                    ),
                    400,
                )

            logger.info(f"{len(configs)} data transformations finished successfully")
            return (
                jsonify(
                    {
                        "message": f"{len(configs)} data transformations finished successfully"
                    }
                ),
                200,
            )

        @self.app.route("/data_transformation/<configuration>")
        def route_data_transformation(configuration):
            logger.info(f"Received request for data transformation: {configuration}")
            config = StageConfiguration.load_from_toml(f"/staging/{configuration}.toml")
            self.process_data_transformation([config])
            logger.info(
                f"Data transformation for {configuration} finished successfully"
            )
            return jsonify({"message": "Data transformation finished successfully"})

        @self.app.route("/")
        def route_index():
            logger.info("Received request for index")
            return "<h1>API is alive</h1?", 200

        @self.app.route("/query/<database>", methods=["POST"])
        def execute_query(database: str):
            # logger.info(f"Received query request for database: {database}")
            if request.json is None:
                logger.error("No JSON data provided")
                return jsonify({"error": "No json data provided"}), 400
            query = request.json.get("query")

            if not query:
                logger.error("No query provided")
                return jsonify({"error": "No query provided"}), 400

            placeholders = request.json.get("placeholders")
            awaits_result = request.json.get("awaits_result", True)

            try:
                # logger.info(f"Executing query... : \n {query}\n")
                # logger.info(f"With placeholders ... : \n {placeholders}\n")

                results = self.query(database, query, placeholders, awaits_result)

                # logger.info(
                #     f"Query executed successfully on database: {database} -> returning {len(results)}"
                # )
                return (
                    Response(
                        json.dumps(results, default=str), mimetype="application/json"
                    ),
                    200,
                )
            except InvalidTableName:
                logger.error(f"Invalid table name provided for database: {database}")
                return jsonify({"error": "Invalid table name provided"}), 400
            except TableNotFoundError:
                logger.error(f"Requested table not found in the database: {database}")
                return (
                    jsonify({"error": "Requested table not found in the database"}),
                    404,
                )
            except InvalidDatabaseName:
                logger.error(f"Invalid database name: {database}")
                return jsonify({"error": "Invalid database name provided"}), 404
            except UndefinedTable:
                logger.error(f"Table is not defined in the database: {database}")
                return jsonify({"error": "Table is not defined in the database"}), 404
            except Exception as e:
                logger.error(f"Unexpected error during query execution: {str(e)}")
                raise e

        @self.app.route("/view-table-association", methods=["GET"])
        def route_tables_views_association():
            logger.info("Received request for view-table association")
            return self.view_table_association()

        @self.app.route("/tables/<database>", methods=["GET"])
        def get_tables(database: str):
            return self.tables(database), 200

        @self.app.route("/transformation_occured", methods=["GET"])
        def get_transformation_occured():
            return (
                jsonify({"transformation_occured": self.get_transformation_occured()}),
                200,
            )

        @self.app.route("/transactions_tables", methods=["GET"])
        def get_transaction_tables():
            return (
                jsonify(self.transactions_tables()),
                200,
            )

        @self.app.route("/schema/<database>/<table_name>", methods=["GET"])
        def get_detailed_table_schema(database: str, table_name: str):
            logger.info(f"Fetching detailed schema for {table_name} in {database}")
            try:
                column_info = self.get_column_info(table_name, database)
                return jsonify(column_info), 200
            except InvalidTableName:
                return (
                    jsonify({"error": f"Table {table_name} not found in {database}"}),
                    404,
                )
            except InvalidDatabaseName:
                return jsonify({"error": "Invalid database name"}), 400

        @self.app.route("/schema/<database>", methods=["GET"])
        def get_detailed_schema(database: str):
            logger.info(f"Fetching detailed schema in {database}")
            try:
                column_info = self.get_tables_columns_info(database)
                return jsonify(column_info), 200

            except InvalidDatabaseName:
                return jsonify({"error": "Invalid database name"}), 400

    def run(self):
        logger.info("Starting API server")
        self.app.run(host=self.host, debug=self.debug)
        return self
