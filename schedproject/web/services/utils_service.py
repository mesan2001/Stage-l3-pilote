from typing import TYPE_CHECKING

import requests

from flask import jsonify

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp
from utils.misc import parse_rules_catalog, populate_database


class UtilsService:
    def __init__(self, app: "InterfacesWebApp"):
        self.app = app

    def populate_db(self):
        populate_database(host=self.app.db_service.host, port=self.app.db_service.port)
        return "Populating done.", 200

    def get_transformation(self):
        response = requests.get(f"{self.app.db_service.hostport}/data_transformation")
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(
                {"error": response.json(), "status_code": response.status_code}
            )

    def rules_catalog_route(self):
        try:
            catalog = self.rules_catalog()
            return jsonify(catalog), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def rules_catalog(self):
        return parse_rules_catalog("resources/rules_catalog.xml")
