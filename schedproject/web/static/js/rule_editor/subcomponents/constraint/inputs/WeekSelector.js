import { BaseInput } from "./BaseInput.js";

export class WeekSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            startDate: new Date(),
            endDate: new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days ahead
            exclusions: [],
            mode: "different", // "different" or "same"
        };
    }

    async beforeRender() {
        await super.beforeRender();

        // Set dates from options
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

        // Initialize selected weeks
        this.selectedWeeks = new Set();

        // If value is provided, populate selected weeks
        if (Array.isArray(this.value)) {
            this.selectedWeeks = new Set(this.value);
        }

        // Generate weeks data
        this.weeks = this.generateWeeks();
    }

    generateWeeks() {
        const weeks = [];
        let currentDate = new Date(this.startDate);

        // Set to the start of the week (Monday)
        currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);

        while (currentDate <= this.endDate) {
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 4); // Friday

            if (this.isWeekSelectable(currentDate, weekEnd)) {
                weeks.push({
                    start: new Date(currentDate),
                    end: new Date(weekEnd),
                    weekNumber: this.getWeekNumber(currentDate),
                });
            }

            currentDate.setDate(currentDate.getDate() + 7); // Move to next week
        }

        return weeks;
    }

    isWeekSelectable(weekStart, weekEnd) {
        // Check if the week is completely outside the date range
        if (weekEnd < this.startDate || weekStart > this.endDate) {
            return false;
        }

        // Check if the week overlaps with any exclusion periods
        return !this.exclusions.some(([exStart, exEnd]) => {
            const exclusionStart = new Date(exStart);
            const exclusionEnd = new Date(exEnd);
            return !(weekEnd < exclusionStart || weekStart > exclusionEnd);
        });
    }

    getWeekNumber(date) {
        const d = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
        );
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to Thursday of the week
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "week-selector space-y-6";

        // Add label if provided
        if (this.label) {
            const labelElement = document.createElement("label");
            labelElement.className =
                "block text-sm font-medium text-gray-700 mb-2";
            labelElement.textContent = this.label;
            wrapper.appendChild(labelElement);
        }

        // Weeks grid
        const weeksContainer = document.createElement("div");
        weeksContainer.className = "weeks-container grid grid-cols-4 gap-4";
        weeksContainer.id = this.getId("weeks-grid");

        weeksContainer.innerHTML = this.weeks
            .map(
                (week) => `
                <div class="week-item border rounded-lg overflow-hidden">
                    <button class="w-full h-full p-3 text-left transition-colors ${
                        this.selectedWeeks.has(week.weekNumber)
                            ? "bg-blue-50 border-blue-500"
                            : "hover:bg-gray-50"
                    }" data-week="${week.weekNumber}" id="${this.getId(`week-${week.weekNumber}`)}">
                        <div class="font-medium">Week ${week.weekNumber}</div>
                        <div class="text-sm text-gray-500">
                            ${week.start.toLocaleDateString()} - ${week.end.toLocaleDateString()}
                        </div>
                    </button>
                </div>
            `,
            )
            .join("");

        // Mode indicator
        const modeIndicator = document.createElement("div");
        modeIndicator.className =
            "mode-indicator flex items-center gap-2 p-3 bg-blue-50 rounded-lg";
        modeIndicator.innerHTML = `
            <svg class="w-5 h-5 ${this.mode === "different" ? "text-red-500" : "text-green-500"}"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${
                    this.mode === "different"
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>'
                }
            </svg>
            <span class="text-blue-800">Sessions must occur in ${this.mode === "different" ? "different" : "the same"} weeks</span>
        `;

        // Selection summary
        const summary = document.createElement("div");
        summary.className = "selection-summary p-4 bg-gray-50 rounded-lg";
        summary.id = this.getId("selection-summary");
        summary.innerHTML = this.renderSummary();

        // Example section
        const examples = document.createElement("div");
        examples.className =
            "examples grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg";
        examples.innerHTML = `
            <div class="valid-example p-3 bg-white rounded-lg border border-green-200">
                <h4 class="font-medium text-green-700 mb-2">Valid Selection</h4>
                <div class="space-y-1 text-sm">
                    <div class="p-2 bg-green-50 rounded">Session 1: Week 1</div>
                    <div class="p-2 bg-green-50 rounded">Session 2: Week 3</div>
                    <div class="p-2 bg-green-50 rounded">Session 3: Week 5</div>
                </div>
            </div>
            <div class="invalid-example p-3 bg-white rounded-lg border border-red-200">
                <h4 class="font-medium text-red-700 mb-2">Invalid Selection</h4>
                <div class="space-y-1 text-sm">
                    <div class="p-2 bg-red-50 rounded">Session 1: Week 1</div>
                    <div class="p-2 bg-red-50 rounded">Session 2: Week 1</div>
                    <div class="p-2 bg-red-50 rounded">Session 3: Week 3</div>
                </div>
            </div>
        `;

        wrapper.appendChild(weeksContainer);
        wrapper.appendChild(modeIndicator);
        wrapper.appendChild(summary);
        wrapper.appendChild(examples);

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    renderSummary() {
        if (this.selectedWeeks.size === 0) {
            return '<p class="text-gray-500">No weeks selected</p>';
        }

        const selectedWeeks = Array.from(this.selectedWeeks)
            .sort((a, b) => a - b)
            .map((weekNum) => {
                const week = this.weeks.find((w) => w.weekNumber === weekNum);
                return `
                    <div class="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span>Week ${weekNum} (${week?.start.toLocaleDateString()} - ${week?.end.toLocaleDateString()})</span>
                        <button class="remove-week text-blue-600 hover:text-blue-800" data-week="${weekNum}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                `;
            });

        return `
            <h4 class="font-medium mb-2">Selected Weeks</h4>
            <div class="space-y-2">
                ${selectedWeeks.join("")}
            </div>
        `;
    }

    async bindEvents() {
        const weeksGrid = document.getElementById(this.getId("weeks-grid"));
        const summary = document.getElementById(
            this.getId("selection-summary"),
        );

        if (weeksGrid) {
            // Use event delegation for week buttons
            weeksGrid.addEventListener("click", (e) => {
                const button = e.target.closest("button[data-week]");
                if (!button) return;

                const weekNum = parseInt(button.dataset.week);

                if (this.selectedWeeks.has(weekNum)) {
                    this.selectedWeeks.delete(weekNum);
                } else {
                    if (this.mode === "same") {
                        this.selectedWeeks.clear();
                    }
                    this.selectedWeeks.add(weekNum);
                }

                this.updateSelection();
                this.updateValue();
            });
        }

        if (summary) {
            // Use event delegation for remove buttons
            summary.addEventListener("click", (e) => {
                const button = e.target.closest(".remove-week");
                if (!button) return;

                e.stopPropagation();
                const weekNum = parseInt(button.dataset.week);
                this.selectedWeeks.delete(weekNum);

                this.updateSelection();
                this.updateValue();
            });
        }
    }

    updateSelection() {
        // Update week buttons
        this.weeks.forEach((week) => {
            const weekButton = document.getElementById(
                this.getId(`week-${week.weekNumber}`),
            );
            if (!weekButton) return;

            if (this.selectedWeeks.has(week.weekNumber)) {
                weekButton.classList.add("bg-blue-50", "border-blue-500");
                weekButton.classList.remove("hover:bg-gray-50");
            } else {
                weekButton.classList.remove("bg-blue-50", "border-blue-500");
                weekButton.classList.add("hover:bg-gray-50");
            }
        });

        // Update selection summary
        const summary = document.getElementById(
            this.getId("selection-summary"),
        );
        if (summary) {
            summary.innerHTML = this.renderSummary();
        }
    }

    updateValue() {
        this.value = Array.from(this.selectedWeeks);
        this.notifyChange("input:change", this.value);
    }

    getValue() {
        return Array.from(this.selectedWeeks);
    }

    setValue(value) {
        if (Array.isArray(value)) {
            if (this.mode === "same" && value.length > 1) {
                // In "same" mode, only keep one week
                this.selectedWeeks = new Set([value[0]]);
            } else {
                this.selectedWeeks = new Set(value);
            }

            this.value = Array.from(this.selectedWeeks);

            if (this.initialized) {
                this.updateSelection();
            }
        }
    }

    validate() {
        if (this.required && this.selectedWeeks.size === 0) {
            return false;
        }

        if (
            this.mode === "different" &&
            this.required &&
            this.selectedWeeks.size < 2
        ) {
            return false;
        }

        return this.validators.every((validator) =>
            validator(Array.from(this.selectedWeeks)),
        );
    }

    setMode(mode) {
        if (mode !== "different" && mode !== "same") {
            console.warn(`Invalid mode: ${mode}. Using "different" instead.`);
            mode = "different";
        }

        this.mode = mode;

        if (this.mode === "same" && this.selectedWeeks.size > 1) {
            // Keep only one week in "same" mode
            this.selectedWeeks = new Set([Array.from(this.selectedWeeks)[0]]);
            this.value = Array.from(this.selectedWeeks);
        }

        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }
}
