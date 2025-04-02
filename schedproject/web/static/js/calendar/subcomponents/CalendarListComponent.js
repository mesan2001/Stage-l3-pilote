import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Calendar } from "../../models/Calendar.js";

export class CalendarListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            calendars: [],
        };
    }

    async render() {
        if (!Array.isArray(this.options.calendars)) {
            this.options.calendars = [];
        }

        if (this.options.calendars.length === 0) {
            try {
                const allCalendars = await Calendar.getAll();
                if (allCalendars && allCalendars.length > 0) {
                    this.options.calendars = allCalendars;
                } else {
                    console.log("No calendars found in database");
                }
            } catch (error) {
                console.error("Error loading calendars:", error);
            }
        }

        this.container.innerHTML = `
            <div class="calendar-list-component">
                <div id="${this.getId("list")}" class="space-y-2 max-h-96 overflow-y-auto">
                    ${this.renderCalendarList()}
                </div>
                <div class="mt-4">
                    <button id="${this.getId("create-calendar")}" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Create New Calendar
                    </button>
                </div>
            </div>
        `;
    }

    renderCalendarList() {
        if (this.options.calendars.length === 0) {
            return '<p class="text-gray-500 p-3">No calendars available. Create a new calendar to get started.</p>';
        }

        const result = this.options.calendars
            .map(
                (calendar) => `
            <div class="flex items-center justify-between p-3 border rounded-lg">
                <span class="font-medium">${calendar.name || "Global Calendar"}</span>
                <div class="flex space-x-2">
                    <button class="edit-calendar px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
                            data-calendar-id="${calendar.id}">
                        Edit
                    </button>
                    ${
                        calendar.type !== "global"
                            ? `
                        <button class="delete-calendar px-3 py-1 text-sm text-red-600 hover:text-red-800"
                                data-calendar-id="${calendar.id}">
                            Delete
                        </button>
                    `
                            : ""
                    }
                </div>
            </div>
        `,
            )
            .join("");
        return result;
    }

    async bindEvents() {
        this.container.addEventListener("click", (e) => {
            if (
                e.target.classList.contains("edit-calendar") ||
                e.target.closest(".edit-calendar")
            ) {
                const button = e.target.classList.contains("edit-calendar")
                    ? e.target
                    : e.target.closest(".edit-calendar");
                const calendarId = button.dataset.calendarId;
                this.handleCalendarEdit(calendarId);
            }

            if (
                e.target.classList.contains("delete-calendar") ||
                e.target.closest(".delete-calendar")
            ) {
                const button = e.target.classList.contains("delete-calendar")
                    ? e.target
                    : e.target.closest(".delete-calendar");
                const calendarId = button.dataset.calendarId;
                this.handleCalendarDelete(calendarId);
            }

            if (
                e.target.id === this.getId("create-calendar") ||
                e.target.closest(`#${this.getId("create-calendar")}`)
            ) {
                this.handleCreateCalendar();
            }
        });
    }

    handleCalendarEdit(calendarId) {
        this.notifyChange("calendar:selected", calendarId);
    }

    handleCreateCalendar() {
        this.notifyChange("calendar:create", null);
    }

    async handleCalendarDelete(calendarId) {
        const calendar = this.options.calendars.find(
            (c) => c.id === parseInt(calendarId),
        );

        if (!calendar) {
            Toast.error("Calendar not found");
            return;
        }

        if (calendar.type === "global") {
            Toast.error("Cannot delete the global calendar");
            return;
        }

        if (
            !confirm(
                `Are you sure you want to delete the calendar "${calendar.name}"?`,
            )
        ) {
            return;
        }

        try {
            const calendarObj = await Calendar.getById(calendarId);
            if (!calendarObj) {
                Toast.error("Calendar not found");
                return;
            }

            await calendarObj.delete();
            this.options.calendars = this.options.calendars.filter(
                (c) => c.id !== parseInt(calendarId),
            );
            this.render();

            Toast.success("Calendar deleted successfully");
            this.notifyChange("calendar:deleted", calendarId);
        } catch (error) {
            Toast.error("Failed to delete calendar", error);
        }
    }
}
