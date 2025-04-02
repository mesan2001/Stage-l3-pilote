from datetime import date
import json
from services.abstract_service import AbstractService
from typing import TYPE_CHECKING, Any, Dict, List
from services.database_service import equals
from routes.calendars_routes import CalendarsRoutes, PeriodsRoutes

if TYPE_CHECKING:
    from interface_web_app import InterfacesWebApp


class CalendarsService(AbstractService):
    _table_name = "calendars"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, CalendarsRoutes)

    def get_calendar_periods(self, calendar_id: str | int) -> List[Dict]:
        return self.app.periods_service.get_periods_by_calendar(calendar_id)

    def get_calendar_period_names(self, calendar_id: str | int) -> List[str]:
        periods = self.get_calendar_periods(calendar_id)
        return [period["name"] for period in periods]


class PeriodsService(AbstractService):
    _table_name = "periods"

    def __init__(self, app: "InterfacesWebApp") -> None:
        super().__init__(app, PeriodsRoutes)

    def get_periods_by_calendar(self, calendar_id: str | int) -> list[dict]:
        return self.filter(equals("calendar_id", calendar_id))

    def _validate(self, data: dict[str, Any]) -> dict[str, Any]:
        weekdays = data.get("weekdays", [])
        if isinstance(weekdays, str):
            try:
                weekdays = json.loads(weekdays)
            except json.JSONDecodeError:
                raise ValueError("Weekdays must be a valid JSON array")

        if not isinstance(weekdays, list):
            raise ValueError("Weekdays must be a list")

        valid_weekdays = []
        for day in weekdays:
            if isinstance(day, int):
                if day < 0 or day > 6:
                    raise ValueError("Weekdays must be integers between 0 and 6")
                valid_weekdays.append(day)
            elif isinstance(day, str):
                day_lower = day.lower().strip()
                weekday_mapping = {
                    "monday": 0,
                    "mon": 0,
                    "tuesday": 1,
                    "tue": 1,
                    "wednesday": 2,
                    "wed": 2,
                    "thursday": 3,
                    "thu": 3,
                    "friday": 4,
                    "fri": 4,
                    "saturday": 5,
                    "sat": 5,
                    "sunday": 6,
                    "sun": 6,
                }
                if day_lower in weekday_mapping:
                    valid_weekdays.append(weekday_mapping[day_lower])
                elif day.isdigit() and 0 <= int(day) <= 6:
                    valid_weekdays.append(int(day))
                else:
                    raise ValueError(
                        f"Invalid weekday: {day}. Use 0-6 or day names like 'Monday', 'mon' ..."
                    )
            else:
                raise ValueError("Weekdays must be integers or day names")

        data["weekdays"] = json.dumps(valid_weekdays)

        exclusions = data.get("exclusions", [])
        if isinstance(exclusions, str):
            try:
                exclusions = json.loads(exclusions)
            except json.JSONDecodeError:
                raise ValueError("Exclusions must be a valid JSON array")

        if not isinstance(exclusions, list):
            raise ValueError("Exclusions must be a list")

        valid_exclusions = []
        for exclusion in exclusions:
            if isinstance(exclusion, str):
                try:
                    date.fromisoformat(exclusion)
                    valid_exclusions.append(exclusion)
                except ValueError:
                    raise ValueError(f"Invalid date format in exclusions: {exclusion}")
            else:
                raise ValueError("Exclusions must contain date strings")

        data["exclusions"] = json.dumps(valid_exclusions)

        return data
