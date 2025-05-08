import { BaseInput } from "./BaseInput.js";

export class DailySlotSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            startHour: 8,
            endHour: 18,
            interval: 30,
            mode: "different", // "different" or "same"
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.startHour = this.options.startHour;
        this.endHour = this.options.endHour;
        this.interval = this.options.interval;
        this.mode = this.options.mode;

        // Initialize selected slots
        this.selectedSlots = new Set(this.value || []);
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "daily-slot-selector space-y-4";

        // Add label if provided
        if (this.label) {
            const labelElement = document.createElement("label");
            labelElement.className =
                "block text-sm font-medium text-gray-700 mb-2";
            labelElement.textContent = this.label;
            wrapper.appendChild(labelElement);
        }

        // Create grid container for time slots
        const gridContainer = document.createElement("div");
        gridContainer.className = "grid grid-cols-4 gap-2";
        gridContainer.id = this.getId("slots-grid");

        // Generate time slots
        const slots = this.generateTimeSlots();
        slots.forEach((slot) => {
            const slotElement = document.createElement("div");
            slotElement.className = `
                time-slot-item p-3 border rounded-md cursor-pointer text-center
                ${this.selectedSlots.has(slot) ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"}
            `;
            slotElement.dataset.slot = slot;
            slotElement.innerHTML = `
                <div class="font-medium">${this.formatTimeSlot(slot)}</div>
            `;
            gridContainer.appendChild(slotElement);
        });

        wrapper.appendChild(gridContainer);

        // Add mode indicator
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
            <span>Sessions must occur at ${this.mode === "different" ? "different" : "the same"} daily time slots</span>
        `;
        wrapper.appendChild(modeIndicator);

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        const slotsGrid = document.getElementById(this.getId("slots-grid"));
        if (!slotsGrid) return;

        slotsGrid.querySelectorAll(".time-slot-item").forEach((item) => {
            item.addEventListener("click", () => {
                const slot = item.dataset.slot;

                if (this.mode === "different") {
                    // Toggle slot selection
                    if (this.selectedSlots.has(slot)) {
                        this.selectedSlots.delete(slot);
                    } else {
                        this.selectedSlots.add(slot);
                    }
                } else {
                    // In "same" mode, only one slot can be selected
                    this.selectedSlots.clear();
                    this.selectedSlots.add(slot);
                }

                this.updateSelection();
                this.value = Array.from(this.selectedSlots);
                this.notifyChange("input:change", this.value);
            });
        });
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

    formatTimeSlot(slot) {
        return slot;
    }

    updateSelection() {
        const slotsGrid = document.getElementById(this.getId("slots-grid"));
        if (!slotsGrid) return;

        slotsGrid.querySelectorAll(".time-slot-item").forEach((item) => {
            const slot = item.dataset.slot;
            if (this.selectedSlots.has(slot)) {
                item.classList.add("bg-blue-100", "border-blue-500");
                item.classList.remove("hover:bg-gray-50");
            } else {
                item.classList.remove("bg-blue-100", "border-blue-500");
                item.classList.add("hover:bg-gray-50");
            }
        });
    }

    getValue() {
        return Array.from(this.selectedSlots);
    }

    setValue(value) {
        this.selectedSlots = new Set(value || []);
        this.value = value;

        if (this.initialized) {
            this.updateSelection();
        }
    }

    validate() {
        if (this.required && this.selectedSlots.size === 0) {
            return false;
        }

        // For "different" mode, at least 2 slots should be selected
        if (
            this.mode === "different" &&
            this.required &&
            this.selectedSlots.size < 2
        ) {
            return false;
        }

        return this.validators.every((validator) =>
            validator(Array.from(this.selectedSlots)),
        );
    }

    setMode(mode) {
        if (mode !== "different" && mode !== "same") {
            console.warn(`Invalid mode: ${mode}. Using "different" instead.`);
            mode = "different";
        }

        this.mode = mode;

        if (this.mode === "same" && this.selectedSlots.size > 1) {
            // Keep only one slot in "same" mode
            this.selectedSlots = new Set([Array.from(this.selectedSlots)[0]]);
            this.value = Array.from(this.selectedSlots);
        }

        if (this.initialized) {
            this.render();
            this.bindEvents();
        }
    }
}
