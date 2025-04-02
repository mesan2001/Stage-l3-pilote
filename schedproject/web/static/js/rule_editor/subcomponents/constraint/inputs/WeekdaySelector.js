import { BaseInput } from "./BaseInput.js";

export class WeekdaySelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            mode: "different", // "different" or "same"
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.weekDays = this.options.weekDays || [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
        ];
        this.mode = this.options.mode || "different";

        // Initialize selected days
        this.selectedDays = new Set();

        // If value is provided, populate the selected days
        if (Array.isArray(this.value)) {
            this.selectedDays = new Set(this.value);
        }
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "weekday-selector space-y-4";

        // Add label if provided
        if (this.label) {
            const labelElement = document.createElement("label");
            labelElement.className =
                "block text-sm font-medium text-gray-700 mb-2";
            labelElement.textContent = this.label;
            wrapper.appendChild(labelElement);
        }

        const grid = document.createElement("div");
        grid.className = "grid grid-cols-5 gap-2";
        grid.id = this.getId("days-grid");

        grid.innerHTML = this.weekDays
            .map(
                (day) => `
                <div class="weekday-item p-3 border rounded-md cursor-pointer text-center
                      ${this.selectedDays.has(day) ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"}"
                     data-day="${day}" id="${this.getId(`day-${day}`)}">
                    <div class="font-medium">${day.slice(0, 3)}</div>
                    <div class="text-xs text-gray-500">${day}</div>
                </div>
            `,
            )
            .join("");

        const modeIndicator = document.createElement("div");
        modeIndicator.className =
            "mode-indicator text-sm text-gray-600 flex items-center gap-2 p-2 bg-gray-50 rounded-md";
        modeIndicator.innerHTML = `
            <svg class="w-5 h-5 ${this.mode === "different" ? "text-red-500" : "text-green-500"}"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${
                    this.mode === "different"
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
                }
            </svg>
            <span>Sessions must occur on ${this.mode === "different" ? "different" : "the same"} weekdays</span>
        `;

        // Add selected days summary
        const summary = document.createElement("div");
        summary.className = "selected-days-summary mt-4";
        summary.id = this.getId("selected-summary");
        summary.innerHTML = this.renderSelectedSummary();

        wrapper.appendChild(grid);
        wrapper.appendChild(modeIndicator);
        wrapper.appendChild(summary);

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        const daysGrid = document.getElementById(this.getId("days-grid"));

        if (daysGrid) {
            // Using event delegation for better performance
            daysGrid.addEventListener("click", (e) => {
                const dayItem = e.target.closest(".weekday-item");
                if (!dayItem) return;

                const day = dayItem.dataset.day;

                if (this.mode === "different") {
                    // Toggle day selection
                    if (this.selectedDays.has(day)) {
                        this.selectedDays.delete(day);
                    } else {
                        this.selectedDays.add(day);
                    }
                } else {
                    // In "same" mode, only one day can be selected
                    this.selectedDays.clear();
                    this.selectedDays.add(day);
                }

                this.updateSelection();
                this.updateValue();
            });
        }
    }

    updateSelection() {
        // Update the visual state of day items
        this.weekDays.forEach((day) => {
            const dayElement = document.getElementById(
                this.getId(`day-${day}`),
            );
            if (!dayElement) return;

            if (this.selectedDays.has(day)) {
                dayElement.classList.add("bg-blue-100", "border-blue-500");
                dayElement.classList.remove("hover:bg-gray-50");
            } else {
                dayElement.classList.remove("bg-blue-100", "border-blue-500");
                dayElement.classList.add("hover:bg-gray-50");
            }
        });

        // Update the summary section
        const summary = document.getElementById(this.getId("selected-summary"));
        if (summary) {
            summary.innerHTML = this.renderSelectedSummary();
        }
    }

    renderSelectedSummary() {
        if (this.selectedDays.size === 0) {
            return `<p class="text-gray-500">No weekdays selected</p>`;
        }

        const selectedList = Array.from(this.selectedDays)
            .map(
                (day) => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${day}
                </span>
            `,
            )
            .join(" ");

        return `
            <div class="p-3 bg-gray-50 rounded-md">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Selected Weekdays:</h4>
                <div class="flex flex-wrap gap-2">
                    ${selectedList}
                </div>
            </div>
        `;
    }

    updateValue() {
        this.value = Array.from(this.selectedDays);
        this.notifyChange("input:change", this.value);
    }

    getValue() {
        return Array.from(this.selectedDays);
    }

    setValue(value) {
        if (Array.isArray(value)) {
            // Handle "same" mode - ensure only one selection
            if (this.mode === "same" && value.length > 1) {
                this.selectedDays = new Set([value[0]]);
            } else {
                this.selectedDays = new Set(value);
            }

            this.value = Array.from(this.selectedDays);

            if (this.initialized) {
                this.updateSelection();
            }
        }
    }

    validate() {
        if (this.required && this.selectedDays.size === 0) {
            return false;
        }

        // For "different" mode, at least 2 days should be selected
        if (
            this.mode === "different" &&
            this.required &&
            this.selectedDays.size < 2
        ) {
            return false;
        }

        return this.validators.every((validator) =>
            validator(Array.from(this.selectedDays)),
        );
    }

    setMode(mode) {
        if (mode !== "different" && mode !== "same") {
            console.warn(`Invalid mode: ${mode}. Using "different" instead.`);
            mode = "different";
        }

        this.mode = mode;

        if (this.mode === "same" && this.selectedDays.size > 1) {
            // Keep only one day in "same" mode
            this.selectedDays = new Set([Array.from(this.selectedDays)[0]]);
            this.value = Array.from(this.selectedDays);
        }

        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }
}
