import { BaseInput } from "./BaseInput.js";

export class WeekGridSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            startHour: 8,
            endHour: 18,
            weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
            exclusions: [],
            slotDuration: 60,
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.slotDuration = this.options.slotDuration;
        this.startHour = this.options.startHour;
        this.endHour = this.options.endHour;
        this.weekDays = this.options.weekDays;
        this.startDate = this.options.startDate;
        this.endDate = this.options.endDate;
        this.exclusions = this.options.exclusions;
        this.currentWeek = new Date();
        this.selectedSlots = new Map();

        // If we have a value, populate the selected slots
        if (this.value) {
            this.selectedSlots = new Map(
                this.value.map((slotId) => {
                    const parts = slotId.split("-");
                    const dateIso =
                        parts.length >= 3 ? parts[2] : new Date().toISOString();
                    return [slotId, new Date(dateIso)];
                }),
            );
        }

        // Error handling for missing configuration
        this.hasError =
            !this.startDate ||
            !this.endDate ||
            !this.weekDays ||
            !this.weekDays.length;
        if (this.hasError) {
            this.errorMessage =
                "Please select a calendar first to configure the weekly grid.";
        }
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "week-grid-selector";

        if (this.hasError) {
            wrapper.innerHTML = this.renderError();
            this.container.innerHTML = "";
            this.container.appendChild(wrapper);
            return;
        }

        wrapper.appendChild(this.renderWeekNavigation());
        wrapper.appendChild(this.renderPropagateButton());
        wrapper.appendChild(this.renderTimeGrid());

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        const prevWeekBtn = this.container.querySelector("#prev-week");
        const nextWeekBtn = this.container.querySelector("#next-week");
        const propagateBtn = this.container.querySelector(
            "[data-action='propagate']",
        );

        if (prevWeekBtn) {
            prevWeekBtn.addEventListener("click", () => this.changeWeek(-1));
        }

        if (nextWeekBtn) {
            nextWeekBtn.addEventListener("click", () => this.changeWeek(1));
        }

        if (propagateBtn) {
            propagateBtn.addEventListener("click", () =>
                this.propagateCurrentWeek(),
            );
        }

        // Bind slot click events
        this.container.querySelectorAll("[data-slot-id]").forEach((slot) => {
            slot.addEventListener("click", () => {
                const slotId = slot.dataset.slotId;
                const date = new Date(slot.dataset.date);
                this.toggleSlot(slotId, slot, date);
            });
        });
    }

    renderError() {
        return `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h3 class="text-lg font-medium text-red-800">Configuration Required</h3>
                </div>
                <p class="text-red-700">${this.errorMessage}</p>
                <div class="bg-white p-3 rounded mt-2 text-sm text-gray-600">
                    <p class="font-medium mb-1">How to fix this:</p>
                    <ol class="list-decimal list-inside space-y-1">
                        <li>Go back to the calendar selection step</li>
                        <li>Choose an appropriate calendar for your schedule</li>
                        <li>Return to this section to configure the time grid</li>
                    </ol>
                </div>
            </div>
        `;
    }

    renderWeekNavigation() {
        const nav = document.createElement("div");
        nav.className = "flex items-center justify-between mb-4";

        nav.innerHTML = `
            <button class="p-2 hover:bg-gray-100 rounded" id="prev-week">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>
            <span class="font-medium text-gray-700" id="week-display">${this.getWeekDisplayText()}</span>
            <button class="p-2 hover:bg-gray-100 rounded" id="next-week">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>
        `;

        return nav;
    }

    renderPropagateButton() {
        const button = document.createElement("button");
        button.className =
            "mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600";
        button.textContent = "Apply to All Weeks";
        button.dataset.action = "propagate";
        return button;
    }

    renderTimeGrid() {
        const grid = document.createElement("div");
        grid.className = "grid grid-cols-6 gap-1";

        // Create header row
        const header = document.createElement("div");
        header.className = "col-span-6 grid grid-cols-6 mb-2";
        header.innerHTML = `<div class="text-center font-medium text-gray-500"></div>`;

        this.weekDays.forEach((day) => {
            header.innerHTML += `
                <div class="text-center font-medium text-gray-700">${day}</div>
            `;
        });
        grid.appendChild(header);

        // Create slots container
        const slotsContainer = document.createElement("div");
        slotsContainer.className = "col-span-6 grid grid-cols-6";

        const slotsPerDay = Math.floor(
            (this.endHour - this.startHour) * (60 / this.slotDuration),
        );

        // Add time labels column
        const timeLabels = document.createElement("div");
        timeLabels.className = "grid";

        for (let i = 0; i < slotsPerDay; i++) {
            const time = this.startHour + (i * this.slotDuration) / 60;
            timeLabels.innerHTML += `
                <div class="h-8 text-right pr-2 text-sm text-gray-500">
                    ${Math.floor(time)}:${((time % 1) * 60).toString().padStart(2, "0")}
                </div>
            `;
        }
        slotsContainer.appendChild(timeLabels);

        // Add columns for each day
        this.weekDays.forEach((day, dayIndex) => {
            const dayColumn = document.createElement("div");
            dayColumn.className = "grid";

            const currentDate = new Date(this.currentWeek);
            currentDate.setDate(
                currentDate.getDate() - currentDate.getDay() + dayIndex + 1,
            );

            for (let i = 0; i < slotsPerDay; i++) {
                const slotTime = this.startHour + (i * this.slotDuration) / 60;
                const slotId = `${day}-${slotTime}`;
                const fullSlotId = `${slotId}-${currentDate.toISOString()}`;

                const slot = document.createElement("div");
                slot.dataset.slotId = fullSlotId;
                slot.dataset.date = currentDate.toISOString();

                const isSelectable = this.isSlotSelectable(currentDate);
                const isSelected = this.selectedSlots.has(fullSlotId);

                if (isSelectable) {
                    slot.className = `h-8 border border-gray-200 ${isSelected ? "bg-blue-100" : "hover:bg-gray-100"} cursor-pointer`;
                } else {
                    slot.className =
                        "h-8 border border-gray-200 bg-gray-300 cursor-not-allowed";
                }

                dayColumn.appendChild(slot);
            }

            slotsContainer.appendChild(dayColumn);
        });

        grid.appendChild(slotsContainer);
        return grid;
    }

    isDateInRange(date) {
        return date >= this.startDate && date <= this.endDate;
    }

    isDateExcluded(date) {
        return this.exclusions.some(([start, end]) => {
            const exclusionStart = new Date(start);
            const exclusionEnd = new Date(end);
            return date >= exclusionStart && date <= exclusionEnd;
        });
    }

    isSlotSelectable(date) {
        if (!this.isDateInRange(date)) return false;
        return !this.isDateExcluded(date);
    }

    toggleSlot(slotId, element, date) {
        if (!this.isSlotSelectable(date)) return;

        if (this.selectedSlots.has(slotId)) {
            this.selectedSlots.delete(slotId);
            element.classList.remove("bg-blue-100");
        } else {
            this.selectedSlots.set(slotId, date);
            element.classList.add("bg-blue-100");
        }

        this.value = Array.from(this.selectedSlots.keys());
    }

    changeWeek(offset) {
        const newDate = new Date(this.currentWeek);
        newDate.setDate(newDate.getDate() + offset * 7);

        const startOfWeek = new Date(newDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 4);

        if (offset < 0 && startOfWeek < this.startDate) return;
        if (offset > 0 && endOfWeek > this.endDate) return;

        this.currentWeek = newDate;
        this.render();
        this.bindEvents();
    }

    propagateCurrentWeek() {
        const currentWeekSlots = new Map();
        const startOfWeek = new Date(this.currentWeek);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        // Find patterns from current week
        this.selectedSlots.forEach((date, slotId) => {
            if (date >= startOfWeek && date <= endOfWeek) {
                const [day, time] = slotId.split("-");
                currentWeekSlots.set(`${day}-${time}`, true);
            }
        });

        // Clear existing selections
        this.selectedSlots.clear();

        // Propagate pattern to all weeks in range
        let currentDate = new Date(this.startDate);
        while (currentDate <= this.endDate) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

            currentWeekSlots.forEach((_, pattern) => {
                const [day, time] = pattern.split("-");
                const dayIndex = this.weekDays.indexOf(day);

                if (dayIndex !== -1) {
                    const slotDate = new Date(weekStart);
                    slotDate.setDate(slotDate.getDate() + dayIndex);

                    if (this.isSlotSelectable(slotDate)) {
                        const fullSlotId = `${day}-${time}-${slotDate.toISOString()}`;
                        this.selectedSlots.set(fullSlotId, slotDate);
                    }
                }
            });

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
        }

        this.value = Array.from(this.selectedSlots.keys());
        this.render();
        this.bindEvents();
    }

    getWeekDisplayText() {
        const startOfWeek = new Date(this.currentWeek);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 4);

        return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    }

    getValue() {
        return Array.from(this.selectedSlots.keys());
    }

    setValue(value) {
        if (!Array.isArray(value)) {
            this.selectedSlots = new Map();
            return;
        }

        this.selectedSlots = new Map(
            value.map((slotId) => {
                const parts = slotId.split("-");
                const dateIso =
                    parts.length >= 3 ? parts[2] : new Date().toISOString();
                return [slotId, new Date(dateIso)];
            }),
        );

        this.value = value;

        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }

    validate() {
        if (this.required && this.selectedSlots.size === 0) {
            return false;
        }
        return this.validators.every((validator) => validator(this.getValue()));
    }
}
