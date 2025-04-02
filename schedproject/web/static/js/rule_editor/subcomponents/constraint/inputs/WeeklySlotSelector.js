import { BaseInput } from "./BaseInput.js";

export class WeeklySlotSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            startHour: 8,
            endHour: 18,
            interval: 30, // in minutes
            weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            compactView: false,
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.startHour = this.options.startHour || 8;
        this.endHour = this.options.endHour || 18;
        this.interval = this.options.interval || 30;
        this.weekDays = this.options.weekDays || [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
        ];
        this.compactView = this.options.compactView || false;

        // Initialize selected values
        this.selectedWeekDay = null;
        this.selectedTime = null;

        // If value is provided, populate the selected values
        if (this.value && typeof this.value === "object") {
            this.selectedWeekDay = this.value.weekDay || null;
            this.selectedTime = this.value.time || null;
        }
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "weekly-slot-selector space-y-4";

        // Add label if provided
        if (this.label) {
            const labelElement = document.createElement("label");
            labelElement.className =
                "block text-sm font-medium text-gray-700 mb-2";
            labelElement.textContent = this.label;
            wrapper.appendChild(labelElement);
        }

        // Weekday selector
        const weekDayContainer = document.createElement("div");
        weekDayContainer.className = "weekday-selector";
        weekDayContainer.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
            <div class="grid grid-cols-5 gap-2" id="${this.getId("weekday-grid")}">
                ${this.weekDays
                    .map(
                        (day) => `
                    <div class="weekday-item p-2 border rounded-md cursor-pointer text-center
                         ${this.selectedWeekDay === day ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"}"
                         data-day="${day}" id="${this.getId(`day-${day}`)}">
                        ${day}
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
        wrapper.appendChild(weekDayContainer);

        // Time selector
        const timeContainer = document.createElement("div");
        timeContainer.className = "time-selector";
        timeContainer.innerHTML = `
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
            <div class="${this.compactView ? "grid grid-cols-6" : "grid grid-cols-4"} gap-2 max-h-60 overflow-y-auto" id="${this.getId("time-grid")}">
                ${this.generateTimeSlots()
                    .map(
                        (slot) => `
                    <div class="time-slot-item p-2 border rounded-md cursor-pointer text-center
                         ${this.selectedTime === slot ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"}"
                         data-time="${slot}" id="${this.getId(`time-${slot.replace(":", "-")}`)}">
                        ${this.formatTimeDisplay(slot)}
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
        wrapper.appendChild(timeContainer);

        // Selection display
        const selectionDisplay = document.createElement("div");
        selectionDisplay.className = "selection-display mt-4";
        selectionDisplay.id = this.getId("selection-display");
        selectionDisplay.innerHTML = this.getSelectionDisplayHTML();
        wrapper.appendChild(selectionDisplay);

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Day selection events
        const weekdayGrid = document.getElementById(this.getId("weekday-grid"));
        if (weekdayGrid) {
            weekdayGrid.addEventListener("click", (e) => {
                const dayItem = e.target.closest(".weekday-item");
                if (!dayItem) return;

                // Update selected day
                this.selectedWeekDay = dayItem.dataset.day;
                this.updateDaySelection();
                this.updateValue();
                this.updateSelectionDisplay();
            });
        }

        // Time selection events
        const timeGrid = document.getElementById(this.getId("time-grid"));
        if (timeGrid) {
            timeGrid.addEventListener("click", (e) => {
                const timeItem = e.target.closest(".time-slot-item");
                if (!timeItem) return;

                // Update selected time
                this.selectedTime = timeItem.dataset.time;
                this.updateTimeSelection();
                this.updateValue();
                this.updateSelectionDisplay();
            });
        }
    }

    updateDaySelection() {
        // Update the visual state of weekday items
        this.weekDays.forEach((day) => {
            const dayElement = document.getElementById(
                this.getId(`day-${day}`),
            );
            if (!dayElement) return;

            if (this.selectedWeekDay === day) {
                dayElement.classList.add("bg-blue-100", "border-blue-500");
                dayElement.classList.remove("hover:bg-gray-50");
            } else {
                dayElement.classList.remove("bg-blue-100", "border-blue-500");
                dayElement.classList.add("hover:bg-gray-50");
            }
        });
    }

    updateTimeSelection() {
        // Update the visual state of time items
        const timeSlots = this.generateTimeSlots();
        timeSlots.forEach((slot) => {
            const timeElement = document.getElementById(
                this.getId(`time-${slot.replace(":", "-")}`),
            );
            if (!timeElement) return;

            if (this.selectedTime === slot) {
                timeElement.classList.add("bg-blue-100", "border-blue-500");
                timeElement.classList.remove("hover:bg-gray-50");
            } else {
                timeElement.classList.remove("bg-blue-100", "border-blue-500");
                timeElement.classList.add("hover:bg-gray-50");
            }
        });
    }

    updateSelectionDisplay() {
        const display = document.getElementById(
            this.getId("selection-display"),
        );
        if (display) {
            display.innerHTML = this.getSelectionDisplayHTML();
        }
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = this.startHour; hour < this.endHour; hour++) {
            for (let minute = 0; minute < 60; minute += this.interval) {
                slots.push(
                    `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
                );
            }
        }
        return slots;
    }

    formatTimeDisplay(slot) {
        // Format the time display based on compactView setting
        if (this.compactView) {
            return slot;
        }

        // More user-friendly format
        const [hours, minutes] = slot.split(":");
        const hour = parseInt(hours);
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

        return `${displayHour}:${minutes} ${period}`;
    }

    getSelectionDisplayHTML() {
        if (!this.selectedWeekDay || !this.selectedTime) {
            return `
                <div class="p-4 bg-gray-50 rounded-md text-gray-500">
                    No slot selected yet. Please select both a day and a time.
                </div>
            `;
        }

        return `
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 class="font-medium text-blue-700 mb-2">Selected Weekly Slot:</h4>
                <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${this.selectedWeekDay}
                    </span>
                    <span class="text-blue-600">at</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${this.formatTimeDisplay(this.selectedTime)}
                    </span>
                </div>
            </div>
        `;
    }

    updateValue() {
        if (this.selectedWeekDay && this.selectedTime) {
            this.value = {
                weekDay: this.selectedWeekDay,
                time: this.selectedTime,
            };
            this.notifyChange("input:change", this.value);
        } else {
            this.value = null;
        }
    }

    getValue() {
        if (!this.selectedWeekDay || !this.selectedTime) {
            return null;
        }

        return {
            weekDay: this.selectedWeekDay,
            time: this.selectedTime,
        };
    }

    setValue(value) {
        if (value && typeof value === "object" && value.weekDay && value.time) {
            this.selectedWeekDay = value.weekDay;
            this.selectedTime = value.time;
            this.value = { ...value };

            if (this.initialized) {
                this.updateDaySelection();
                this.updateTimeSelection();
                this.updateSelectionDisplay();
            }
        } else {
            this.selectedWeekDay = null;
            this.selectedTime = null;
            this.value = null;

            if (this.initialized) {
                this.updateDaySelection();
                this.updateTimeSelection();
                this.updateSelectionDisplay();
            }
        }
    }

    validate() {
        if (this.required && (!this.selectedWeekDay || !this.selectedTime)) {
            return false;
        }

        return this.validators.every((validator) => validator(this.value));
    }

    setTimeDisplayFormat(useCompactView) {
        this.compactView = useCompactView;

        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }
}
