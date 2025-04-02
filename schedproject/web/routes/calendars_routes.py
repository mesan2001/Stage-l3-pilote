from flask import jsonify, render_template
from routes.abstract_routes import AbstractRoutes
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class CalendarsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):

        @AbstractRoutes.INTERFACES_BLUEPRINT.route("calendars")
        def calendar_entry():
            return render_template("calendar.html"), 200


class PeriodsRoutes(AbstractRoutes):
    def __init__(self, service: AbstractService, app: "InterfacesWebApp"):
        super().__init__(service, app)

    def _register_additional_routes(self):
        @self.blueprint.route("/calendar/<calendar_id>", methods=["GET"])
        def get_periods_by_calendar(calendar_id):
            try:
                result = self.app.periods_service.get_periods_by_calendar(calendar_id)
                return jsonify(result), 200
            except Exception as e:
                return jsonify({"error": str(e)}), 500
