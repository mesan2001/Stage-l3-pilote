import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Calendar } from "../../models/Calendar.js";
import { Period } from "../../models/Period.js";
import { PeriodEditorComponent } from "./PeriodEditorComponent.js";

export class CalendarEditorComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            calendarId: null,
            calendar: null,
            periods: [],
        };
    }

    async beforeRender() {
        if (this.options.calendarId) {
            await this.loadCalendarData();
        }
    }

    async loadCalendarData() {
        try {
            const calendar = await Calendar.getById(this.options.calendarId);
            if (!calendar) {
                Toast.error("Calendar not found");
                return;
            }

            this.options.calendar = calendar;

            const periods = await calendar.getPeriods();
            this.options.periods = periods;
        } catch (error) {
            Toast.error("Failed to load calendar data", error);
        }
    }

    async render() {
        if (!this.options.calendar) {
            this.container.innerHTML = `
                <div class="text-center p-8 text-gray-500">
                    <p>No calendar selected</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="calendar-editor-component">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium">${this.options.calendar.name || "Global Calendar"}</h3>
                    <div class="flex space-x-2">
                        <button id="${this.getId("add-period")}" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            Add Period
                        </button>
                        <button id="${this.getId("save")}" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Save Calendar
                        </button>
                    </div>
                </div>

                <div id="${this.getId("periods-container")}" class="space-y-4">
                    ${this.renderPeriods()}
                </div>
            </div>
        `;
        await this.initializePeriodEditors();
    }

    renderPeriods() {
        if (!this.options.periods || this.options.periods.length === 0) {
            return `
                <div class="text-center p-8 text-gray-500">
                    <p>No periods found. Click "Add Period" to create one.</p>
                </div>
            `;
        }

        return this.options.periods
            .map(
                (period, index) => `
            <div id="${this.getId(`period-${index}`)}" class="period-container"></div>
        `,
            )
            .join("");
    }

    async initializePeriodEditors() {
        this.periodEditors = [];

        const sortedPeriods = [...this.options.periods].sort(
            (a, b) => new Date(a.start_date) - new Date(b.start_date),
        );

        sortedPeriods.forEach(async (period, i) => {
            const periodContainer = this.container.querySelector(
                `#${this.getId(`period-${i}`)}`,
            );
            if (!periodContainer) return;

            const periodEditor = new PeriodEditorComponent(periodContainer);
            periodEditor.setOptions({
                period: period,
                index: i,
            });

            await periodEditor.init();
            this.periodEditors.push(periodEditor);
        });
    }

    bindEvents() {
        const addPeriodBtn = this.container.querySelector(
            `#${this.getId("add-period")}`,
        );
        if (addPeriodBtn) {
            addPeriodBtn.addEventListener("click", () =>
                this.handleAddPeriod(),
            );
        }

        const saveBtn = this.container.querySelector(`#${this.getId("save")}`);
        if (saveBtn) {
            saveBtn.addEventListener("click", () => this.handleSaveCalendar());
        }

        document.addEventListener("period:update", (e) => {
            this.handlePeriodUpdate(e.detail.data);
        });

        document.addEventListener("period:delete", (e) => {
            this.handlePeriodDelete(e.detail.data);
        });
    }

    async handleAddPeriod() {
        if (!this.options.calendar) return;

        try {
            const defaultPeriod = new Period({
                calendar_id: this.options.calendarId,
                name: "New Period",
                start_date: new Date().toISOString().split("T")[0],
                end_date: new Date(
                    new Date().setMonth(new Date().getMonth() + 1),
                )
                    .toISOString()
                    .split("T")[0],
                start_hour: "08:00",
                end_hour: "18:00",
                weekdays: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                ],
                exclusions: [],
            });

            await defaultPeriod.save();

            await this.loadCalendarData();
            await this.render();

            Toast.success("Period added successfully");
        } catch (error) {
            Toast.error("Failed to add period", error);
        }
    }

    async handleSaveCalendar() {
        if (!this.options.calendar) return;

        try {
            Toast.success("Calendar saved successfully");
        } catch (error) {
            Toast.error("Failed to save calendar", error);
        }
    }

    async handlePeriodUpdate(data) {
        await this.loadCalendarData();
    }

    async handlePeriodDelete(periodId) {
        try {
            await this.loadCalendarData();
            await this.render();
        } catch (error) {
            Toast.error("Failed to reload periods", error);
        }
    }
}
