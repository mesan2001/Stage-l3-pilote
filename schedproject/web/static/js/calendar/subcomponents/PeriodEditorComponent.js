import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Period } from "../../models/Period.js";

export class PeriodEditorComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            period: null,
            index: 0,
        };
    }

    async render() {
        const period = this.options.period;
        if (!period) {
            this.container.innerHTML =
                '<div class="text-red-500">Invalid period data</div>';
            return;
        }

        this.container.innerHTML = `
            <div class="period-editor mb-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div class="p-4 space-y-4">
                    <div class="flex items-center justify-between border-b pb-4">
                        <input type="text"
                               id="${this.getId("name")}"
                               class="period-name text-lg font-medium bg-transparent border-none focus:ring-0 focus:outline-none"
                               value="${period.name || ""}">
                        <button id="${this.getId("delete")}" class="text-gray-400 hover:text-red-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date"
                                   id="${this.getId("start-date")}"
                                   class="period-start-date w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                   value="${period.start_date || ""}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date"
                                   id="${this.getId("end-date")}"
                                   class="period-end-date w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                   value="${period.end_date || ""}">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input type="time"
                                   id="${this.getId("start-time")}"
                                   class="period-start-time w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                   value="${period.start_hour || ""}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input type="time"
                                   id="${this.getId("end-time")}"
                                   class="period-end-time w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                   value="${period.end_hour || ""}">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Weekdays</label>
                        <div class="flex flex-wrap gap-2">
                            ${[
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                                "Sunday",
                            ]
                                .map(
                                    (day) => `
                                    <label class="inline-flex items-center px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer">
                                        <input type="checkbox"
                                               class="period-weekday w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                               value="${day}"
                                               id="${this.getId(`weekday-${day.toLowerCase()}`)}"
                                               ${period.weekdays && period.weekdays.includes(day) ? "checked" : ""}>
                                        <span class="ml-2 text-sm text-gray-700">${day}</span>
                                    </label>
                                `,
                                )
                                .join("")}
                        </div>
                    </div>

                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Exclusions</label>
                        <div id="${this.getId("exclusions-container")}" class="exclusions-container space-y-3">
                            ${this.renderExclusions()}

                            <div class="add-exclusion-form mt-3 p-4 border border-gray-200 rounded-lg">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <input type="date"
                                               id="${this.getId("exclusion-start-date")}"
                                               class="exclusion-start-date w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                        <input type="date"
                                               id="${this.getId("exclusion-end-date")}"
                                               class="exclusion-end-date w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                    </div>
                                </div>
                                <button id="${this.getId("add-exclusion")}" class="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Add Exclusion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderExclusions() {
        const period = this.options.period;
        if (!period.exclusions || period.exclusions.length === 0) {
            return '<p class="text-gray-500 text-sm">No exclusions added yet.</p>';
        }

        return period.exclusions
            .map(
                (exclusion, idx) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span class="text-sm text-gray-700">
                    ${new Date(exclusion[0]).toLocaleDateString()} - ${new Date(exclusion[1]).toLocaleDateString()}
                </span>
                <button class="remove-exclusion text-red-600 hover:text-red-800" data-index="${idx}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `,
            )
            .join("");
    }

    bindEvents() {
        const nameInput = this.container.querySelector(
            `#${this.getId("name")}`,
        );
        nameInput.addEventListener("change", () => this.handlePeriodUpdate());

        const dateTimeInputs = [
            this.container.querySelector(`#${this.getId("start-date")}`),
            this.container.querySelector(`#${this.getId("end-date")}`),
            this.container.querySelector(`#${this.getId("start-time")}`),
            this.container.querySelector(`#${this.getId("end-time")}`),
        ];

        dateTimeInputs.forEach((input) => {
            input.addEventListener("change", () => this.handlePeriodUpdate());
        });

        const weekdayInputs =
            this.container.querySelectorAll(".period-weekday");
        weekdayInputs.forEach((input) => {
            input.addEventListener("change", () => this.handlePeriodUpdate());
        });

        const deleteBtn = this.container.querySelector(
            `#${this.getId("delete")}`,
        );
        deleteBtn.addEventListener("click", () => this.handlePeriodDelete());

        const addExclusionBtn = this.container.querySelector(
            `#${this.getId("add-exclusion")}`,
        );
        addExclusionBtn.addEventListener("click", () =>
            this.handleAddExclusion(),
        );

        this.container
            .querySelectorAll(".remove-exclusion")
            .forEach((button) => {
                button.addEventListener("click", (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    this.handleRemoveExclusion(index);
                });
            });
    }

    async handlePeriodUpdate() {
        try {
            const period = this.options.period;

            const name = this.container.querySelector(
                `#${this.getId("name")}`,
            ).value;
            const startDate = this.container.querySelector(
                `#${this.getId("start-date")}`,
            ).value;
            const endDate = this.container.querySelector(
                `#${this.getId("end-date")}`,
            ).value;
            const startHour = this.container.querySelector(
                `#${this.getId("start-time")}`,
            ).value;
            const endHour = this.container.querySelector(
                `#${this.getId("end-time")}`,
            ).value;
            const weekdays = Array.from(
                this.container.querySelectorAll(".period-weekday:checked"),
            ).map((cb) => cb.value);

            const periodModel = await Period.getById(period.id);
            if (!periodModel) {
                Toast.error("Period not found");
                return;
            }

            periodModel.name = name;
            periodModel.start_date = startDate;
            periodModel.end_date = endDate;
            periodModel.start_hour = startHour;
            periodModel.end_hour = endHour;
            periodModel.weekdays = weekdays;

            await periodModel.save();

            this.options.period = periodModel;

            this.notifyChange("period:update", periodModel.id);
        } catch (error) {
            Toast.error("Failed to update period", error);
        }
    }

    async handlePeriodDelete() {
        const period = this.options.period;

        if (!period || !period.id) {
            Toast.error("Invalid period data");
            return;
        }

        if (
            !confirm(
                `Are you sure you want to delete the period "${period.name}"?`,
            )
        ) {
            return;
        }

        try {
            const periodModel = await Period.getById(period.id);
            if (!periodModel) {
                Toast.error("Period not found");
                return;
            }

            await periodModel.delete();
            Toast.success("Period deleted successfully");

            this.notifyChange("period:delete", period.id);
        } catch (error) {
            Toast.error("Failed to delete period", error);
        }
    }

    async handleAddExclusion() {
        const startDate = this.container.querySelector(
            `#${this.getId("exclusion-start-date")}`,
        ).value;
        const endDate = this.container.querySelector(
            `#${this.getId("exclusion-end-date")}`,
        ).value;

        if (!startDate || !endDate) {
            Toast.warning(
                "Please select both start and end dates for the exclusion",
            );
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            Toast.warning("Start date must be before end date");
            return;
        }

        try {
            const period = this.options.period;
            const periodModel = await Period.getById(period.id);

            if (!periodModel) {
                Toast.error("Period not found");
                return;
            }

            if (!periodModel.exclusions) {
                periodModel.exclusions = [];
            }

            periodModel.exclusions.push([startDate, endDate]);
            await periodModel.save();

            this.options.period = periodModel;
            await this.render();
            this.bindEvents();

            Toast.success("Exclusion added successfully");
            this.notifyChange("period:update", periodModel.id);
        } catch (error) {
            Toast.error("Failed to add exclusion", error);
        }
    }

    async handleRemoveExclusion(index) {
        try {
            const period = this.options.period;
            const periodModel = await Period.getById(period.id);

            if (!periodModel || !periodModel.exclusions) {
                Toast.error("Invalid period data");
                return;
            }

            periodModel.exclusions.splice(index, 1);
            await periodModel.save();

            this.options.period = periodModel;
            await this.render();
            this.bindEvents();

            Toast.success("Exclusion removed successfully");
            this.notifyChange("period:update", periodModel.id);
        } catch (error) {
            Toast.error("Failed to remove exclusion", error);
        }
    }
}
