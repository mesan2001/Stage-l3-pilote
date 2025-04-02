import { BaseComponent } from "../../components/BaseComponent.js";
import { CalendarListComponent } from "./CalendarListComponent.js";
import { CalendarEditorComponent } from "./CalendarEditorComponent.js";
import { ModalComponent } from "../../components/ModalComponent.js";
import { Toast } from "../../components/Toast.js";
import { Calendar } from "../../models/Calendar.js";

export class CalendarManager extends BaseComponent {
    getDefaultOptions() {
        return {
            currentCalendarId: null,
        };
    }

    async beforeRender() {
        this.createSubcomponents();
        this.modal = new ModalComponent();
    }

    createSubcomponents() {
        this.listContainer = document.createElement("div");
        this.editorContainer = document.createElement("div");
        this.calendarList = new CalendarListComponent(this.listContainer);
        this.calendarEditor = new CalendarEditorComponent(this.editorContainer);
    }

    async render() {
        this.container.innerHTML = `
            <div class="calendar-container bg-white rounded-lg shadow-lg p-6">
                <div class="mb-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold">Calendar Management</h2>
                        <div class="flex space-x-3">
                            <button id="${this.getId("list")}" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                                </svg>
                                Manage Calendars
                            </button>
                            <button id="${this.getId("create")}" class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                                New Calendar
                            </button>
                        </div>
                    </div>
                </div>

                <div id="${this.getId("editor-container")}" class="calendar-content"></div>
            </div>
        `;
        const editorContainer = this.container.querySelector(
            `#${this.getId("editor-container")}`,
        );

        this.editorContainer.innerHTML = "";
        editorContainer.appendChild(this.editorContainer);

        this.container.appendChild(this.listContainer);

        await this.loadInitialCalendar();
    }

    async loadInitialCalendar() {
        try {
            const calendars = await Calendar.getAll();

            if (calendars.length > 0) {
                const globalCalendar = calendars.find(
                    (c) => c.type === "global",
                );
                if (globalCalendar) {
                    this.handleCalendarSelected(globalCalendar.id);
                } else {
                    this.handleCalendarSelected(calendars[0].id);
                }
            }
        } catch (error) {
            Toast.error("Failed to load calendars", error);
        }
    }

    async bindEvents() {
        const listButton = this.container.querySelector(
            `#${this.getId("list")}`,
        );
        const createButton = this.container.querySelector(
            `#${this.getId("create")}`,
        );

        if (listButton) {
            listButton.addEventListener("click", () => {
                this.handleManageCalendarsClick();
            });
        }

        if (createButton) {
            createButton.addEventListener("click", () => {
                this.handleCreateCalendarClick();
            });
        }

        this.listContainer.addEventListener("calendar:selected", (e) => {
            this.handleCalendarSelected(e.detail.data);
            this.modal.close();
        });

        this.listContainer.addEventListener("calendar:deleted", (e) => {
            this.handleCalendarDeleted(e.detail.data);
        });

        document.addEventListener("calendar:selected", (e) => {
            this.handleCalendarSelected(e.detail.data);
        });

        document.addEventListener("calendar:created", (e) => {
            this.handleCalendarCreated(e.detail.data);
        });

        document.addEventListener("calendar:deleted", (e) => {
            this.handleCalendarDeleted(e.detail.data);
        });
    }

    handleManageCalendarsClick() {
        try {
            Calendar.getAll().then((calendars) => {
                const handleCalendarSelection = (e) => {
                    this.handleCalendarSelected(e.detail.data);
                    this.modal.close();

                    this.listContainer.removeEventListener(
                        "calendar:selected",
                        handleCalendarSelection,
                    );
                };

                this.listContainer.addEventListener(
                    "calendar:selected",
                    handleCalendarSelection,
                );

                this.calendarList.setOptions({ calendars });
                this.modal.setOptions({
                    title: "Manage Calendars",
                    content: this.listContainer,
                    buttons: [
                        {
                            text: "Close",
                            handler: (_, modal) => {
                                this.listContainer.removeEventListener(
                                    "calendar:selected",
                                    handleCalendarSelection,
                                );
                                modal.close();
                            },
                        },
                    ],
                });

                this.calendarList.init().then(() => {
                    this.modal.open();
                });
            });
        } catch (error) {
            Toast.error("Failed to load calendars", error);
        }
    }

    handleCreateCalendarClick() {
        const content = `
            <form id="create-calendar-form" class="space-y-4">
                <div>
                    <label for="calendar-name" class="block text-sm font-medium text-gray-700">Calendar Name</label>
                    <input type="text" id="calendar-name" name="calendar-name" required
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </form>
        `;
        this.modal.setOptions({
            title: "Create New Calendar",
            content,
            buttons: [
                {
                    text: "Cancel",
                    handler: (_, modal) => modal.close(),
                },
                {
                    text: "Create",
                    handler: (_, modal) => {
                        this.handleCreateCalendarSubmit(modal);
                    },
                },
            ],
        });

        this.calendarList.init().then(() => {
            this.modal.open();
        });
    }

    async handleCreateCalendarSubmit(modal) {
        const modalContent = modal.container.querySelector(".modal-content");

        if (!modalContent) {
            Toast.error("Modal content not found");
            return;
        }

        const form = modalContent.querySelector("#create-calendar-form");

        if (!form) {
            Toast.error("Form not found");
            return;
        }

        const nameInput = form.querySelector("#calendar-name");

        if (!nameInput) {
            Toast.error("Name input not found");
            return;
        }

        const name = nameInput.value.trim();

        if (!name) {
            Toast.warning("Please enter a calendar name");
            return;
        }

        try {
            const newCalendar = new Calendar({
                name,
                type: "custom",
                periods: [],
            });

            await newCalendar.save();

            modal.close();

            Toast.success("Calendar created successfully");
            this.handleCalendarSelected(newCalendar.id);

            this.notifyChange("calendar:created", newCalendar.id);
        } catch (error) {
            Toast.error("Failed to create calendar", error);
        }
    }

    async handleCalendarSelected(calendarId) {
        if (this.options.currentCalendarId === calendarId) {
            return;
        }

        try {
            const calendar = await Calendar.getById(calendarId);
            if (!calendar) {
                Toast.error("Calendar not found");
                return;
            }

            this.options.currentCalendarId = calendarId;
            this.calendarEditor.setOptions({ calendarId });
            await this.calendarEditor.init();

            const periods = await calendar.getMissingPeriods();
            if (periods && periods.length > 0) {
                Toast.warning(
                    `The following periods are missing in the calendar but are used in programs: ${periods.join(", ")}`,
                );
            }
        } catch (error) {
            Toast.error("Failed to load calendar", error);
        }
    }

    async handleCalendarCreated(calendarId) {
        await this.handleCalendarSelected(calendarId);
    }

    async handleCalendarDeleted(calendarId) {
        if (this.options.currentCalendarId === calendarId) {
            await this.loadInitialCalendar();
        }
    }
}
