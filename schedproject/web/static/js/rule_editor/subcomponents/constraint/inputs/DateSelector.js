import { BaseInput } from "./BaseInput.js";

export class DateSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead by default
            exclusions: [],
            mode: "different", // "different" or "same"
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.startDate =
            this.options.startDate instanceof Date
                ? this.options.startDate
                : new Date(this.options.startDate);

        this.endDate =
            this.options.endDate instanceof Date
                ? this.options.endDate
                : new Date(this.options.endDate);

        this.exclusions = this.options.exclusions || [];
        this.mode = this.options.mode || "different";

        // Initialize selected dates and current month view
        this.selectedDates = new Set(this.value || []);
        this.currentMonth = new Date(this.startDate);
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "date-selector space-y-4";

        // Add label if provided
        if (this.label) {
            const labelElement = document.createElement("label");
            labelElement.className =
                "block text-sm font-medium text-gray-700 mb-2";
            labelElement.textContent = this.label;
            wrapper.appendChild(labelElement);
        }

        // Month navigation
        const navigation = document.createElement("div");
        navigation.className = "flex items-center justify-between mb-4";
        navigation.innerHTML = `
            <button class="p-2 hover:bg-gray-100 rounded" id="${this.getId("prev-month")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>
            <span class="font-medium" id="${this.getId("current-month")}">${this.formatMonthDisplay()}</span>
            <button class="p-2 hover:bg-gray-100 rounded" id="${this.getId("next-month")}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        `;
        wrapper.appendChild(navigation);

        // Calendar grid
        const calendar = document.createElement("div");
        calendar.className = "calendar-grid";
        calendar.id = this.getId("calendar");
        calendar.innerHTML = this.renderCalendar();
        wrapper.appendChild(calendar);

        // Mode indicator
        const modeIndicator = document.createElement("div");
        modeIndicator.className =
            "mode-indicator text-sm text-gray-600 flex items-center gap-2 p-2 bg-gray-50 rounded-md";
        modeIndicator.innerHTML = `
            <svg class="w-5 h-5 ${this.mode === "different" ? "text-red-500" : "text-green-500"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${
                    this.mode === "different"
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
                }
            </svg>
            <span>Sessions must occur on ${this.mode === "different" ? "different" : "the same"} days</span>
        `;
        wrapper.appendChild(modeIndicator);

        // Selected dates display
        const selectedDisplay = document.createElement("div");
        selectedDisplay.className =
            "selected-dates mt-4 p-2 bg-gray-50 rounded-md";
        selectedDisplay.id = this.getId("selected-dates");
        selectedDisplay.innerHTML = this.renderSelectedDates();
        wrapper.appendChild(selectedDisplay);

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Month navigation event handlers
        const prevMonthBtn = document.getElementById(this.getId("prev-month"));
        const nextMonthBtn = document.getElementById(this.getId("next-month"));

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener("click", () => {
                this.changeMonth(-1);
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener("click", () => {
                this.changeMonth(1);
            });
        }

        // Date selection event handlers
        const calendarElement = document.getElementById(this.getId("calendar"));
        if (calendarElement) {
            calendarElement.addEventListener("click", (e) => {
                const dateBtn = e.target.closest("button[data-date]");
                if (!dateBtn) return;

                const date = dateBtn.dataset.date;

                if (this.mode === "different") {
                    // Toggle date selection
                    if (this.selectedDates.has(date)) {
                        this.selectedDates.delete(date);
                    } else {
                        this.selectedDates.add(date);
                    }
                } else {
                    // In "same" mode, only one date can be selected
                    this.selectedDates.clear();
                    this.selectedDates.add(date);
                }

                this.updateCalendar();
                this.updateSelectedDates();
                this.value = Array.from(this.selectedDates);
                this.notifyChange("input:change", this.value);
            });
        }
    }

    renderCalendar() {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const header = weekdays
            .map(
                (day) =>
                    `<div class="text-center font-medium text-gray-700 p-2">${day}</div>`,
            )
            .join("");

        let cells = [];
        const paddingDays = firstDay.getDay();

        // Add empty cells for padding
        for (let i = 0; i < paddingDays; i++) {
            cells.push('<div class="p-2"></div>');
        }

        // Add cells for each day of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split("T")[0];
            const isSelectable = this.isDateSelectable(date);
            const isSelected = this.selectedDates.has(dateString);

            cells.push(`
                <div class="p-2">
                    <button class="w-full p-2 rounded-full ${
                        isSelectable
                            ? isSelected
                                ? "bg-blue-100 border-blue-500 text-blue-700"
                                : "hover:bg-gray-100"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }"
                    ${isSelectable ? `data-date="${dateString}"` : "disabled"}
                    >
                        ${day}
                    </button>
                </div>
            `);
        }

        return `
            <div class="grid grid-cols-7 gap-1">
                ${header}
                ${cells.join("")}
            </div>
        `;
    }

    renderSelectedDates() {
        if (this.selectedDates.size === 0) {
            return '<p class="text-gray-500">No dates selected</p>';
        }

        return `
            <div class="space-y-2">
                <h4 class="font-medium">Selected Dates:</h4>
                <div class="flex flex-wrap gap-2">
                    ${Array.from(this.selectedDates)
                        .sort()
                        .map(
                            (date) => `
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm flex items-center gap-1">
                                ${new Date(date).toLocaleDateString()}
                                <button class="text-blue-500 hover:text-blue-700" data-remove="${date}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </span>
                        `,
                        )
                        .join("")}
                </div>
            </div>
        `;
    }

    updateCalendar() {
        const calendarElement = document.getElementById(this.getId("calendar"));
        if (calendarElement) {
            calendarElement.innerHTML = this.renderCalendar();
        }
    }

    updateSelectedDates() {
        const selectedDatesElement = document.getElementById(
            this.getId("selected-dates"),
        );
        if (selectedDatesElement) {
            selectedDatesElement.innerHTML = this.renderSelectedDates();

            // Attach event listeners to remove buttons
            selectedDatesElement
                .querySelectorAll("[data-remove]")
                .forEach((btn) => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const date = btn.dataset.remove;
                        this.selectedDates.delete(date);
                        this.updateCalendar();
                        this.updateSelectedDates();
                        this.value = Array.from(this.selectedDates);
                        this.notifyChange("input:change", this.value);
                    });
                });
        }
    }

    changeMonth(offset) {
        const newMonth = new Date(this.currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);

        // Don't navigate past date range boundaries
        if (
            offset < 0 &&
            newMonth <
                new Date(
                    this.startDate.getFullYear(),
                    this.startDate.getMonth(),
                    1,
                )
        ) {
            return;
        }

        if (
            offset > 0 &&
            newMonth >
                new Date(this.endDate.getFullYear(), this.endDate.getMonth(), 1)
        ) {
            return;
        }

        this.currentMonth = newMonth;

        // Update month display text
        const monthDisplayElement = document.getElementById(
            this.getId("current-month"),
        );
        if (monthDisplayElement) {
            monthDisplayElement.textContent = this.formatMonthDisplay();
        }

        this.updateCalendar();
    }

    formatMonthDisplay() {
        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        return `${monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
    }

    isDateSelectable(date) {
        // Check if date is within range
        if (date < this.startDate || date > this.endDate) {
            return false;
        }

        // Check if date is not in exclusions
        return !this.exclusions.some(([exStart, exEnd]) => {
            const exclusionStart = new Date(exStart);
            const exclusionEnd = new Date(exEnd);
            return date >= exclusionStart && date <= exclusionEnd;
        });
    }

    getValue() {
        return Array.from(this.selectedDates);
    }

    setValue(value) {
        this.selectedDates = new Set(value || []);
        this.value = value;

        if (this.initialized) {
            this.updateCalendar();
            this.updateSelectedDates();
        }
    }

    validate() {
        if (this.required && this.selectedDates.size === 0) {
            return false;
        }

        // For "different" mode, at least 2 dates should be selected
        if (
            this.mode === "different" &&
            this.required &&
            this.selectedDates.size < 2
        ) {
            return false;
        }

        return this.validators.every((validator) =>
            validator(Array.from(this.selectedDates)),
        );
    }

    setMode(mode) {
        if (mode !== "different" && mode !== "same") {
            console.warn(`Invalid mode: ${mode}. Using "different" instead.`);
            mode = "different";
        }

        this.mode = mode;

        if (this.mode === "same" && this.selectedDates.size > 1) {
            // Keep only one date in "same" mode
            this.selectedDates = new Set([Array.from(this.selectedDates)[0]]);
            this.value = Array.from(this.selectedDates);
        }

        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }
}
