import { BaseInput } from "./BaseInput.js";

export class GapSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            type: "min", // min or max
            maxGap: 10,
            units: [
                { value: "slot", label: "Slots" },
                { value: "day", label: "Days" },
                { value: "week", label: "Weeks" },
                { value: "month", label: "Months" },
            ],
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.type = this.options.type || "min";
        this.values = {
            slot: null,
            day: null,
            week: null,
            month: null,
        };

        // Initialize from value if provided
        if (this.value && typeof this.value === "object") {
            this.type = this.value.type || "min";
            if (this.value.values) {
                this.values = { ...this.values, ...this.value.values };
            }
        }

        this.units = this.options.units || [
            { value: "slot", label: "Slots" },
            { value: "day", label: "Days" },
            { value: "week", label: "Weeks" },
            { value: "month", label: "Months" },
        ];
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "gap-selector space-y-4";

        if (this.label) {
            const label = document.createElement("label");
            label.className = "block text-sm font-medium text-gray-700 mb-2";
            label.textContent = this.label;
            wrapper.appendChild(label);
        }

        const typeSelector = document.createElement("div");
        typeSelector.className = "flex gap-2 mb-4";
        typeSelector.innerHTML = `
            <label class="inline-flex items-center">
                <input type="radio" name="gap-type-${this.getId("type")}" value="min"
                       ${this.type === "min" ? "checked" : ""} class="mr-2" id="${this.getId("type-min")}">
                Minimum Gap
            </label>
            <label class="inline-flex items-center">
                <input type="radio" name="gap-type-${this.getId("type")}" value="max"
                       ${this.type === "max" ? "checked" : ""} class="mr-2" id="${this.getId("type-max")}">
                Maximum Gap
            </label>
        `;
        wrapper.appendChild(typeSelector);

        this.units.forEach((unit) => {
            const inputGroup = document.createElement("div");
            inputGroup.className = "flex gap-2 mb-2";
            inputGroup.innerHTML = `
                <div class="flex-1">
                    <input type="number"
                           min="1"
                           value="${this.values[unit.value] || ""}"
                           class="w-full p-2 border rounded-md"
                           id="${this.getId(`input-${unit.value}`)}"
                           placeholder="Enter ${unit.label.toLowerCase()} amount">
                </div>
                <div class="w-32 flex items-center">
                    <span class="text-gray-600">${unit.label}</span>
                </div>
            `;
            wrapper.appendChild(inputGroup);
        });

        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Type selector
        const minRadio = document.getElementById(this.getId("type-min"));
        const maxRadio = document.getElementById(this.getId("type-max"));

        if (minRadio) {
            minRadio.addEventListener("change", () => {
                if (minRadio.checked) {
                    this.type = "min";
                    this.updateValue();
                }
            });
        }

        if (maxRadio) {
            maxRadio.addEventListener("change", () => {
                if (maxRadio.checked) {
                    this.type = "max";
                    this.updateValue();
                }
            });
        }

        // Number inputs
        this.units.forEach((unit) => {
            const input = document.getElementById(
                this.getId(`input-${unit.value}`),
            );
            if (input) {
                input.addEventListener("input", (e) => {
                    const value = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                    this.values[unit.value] = value;
                    this.updateValue();
                });
            }
        });
    }

    updateValue() {
        this.value = {
            type: this.type,
            values: { ...this.values },
        };
        this.notifyChange("input:change", this.value);
    }

    getValue() {
        return {
            type: this.type,
            values: { ...this.values },
        };
    }

    setValue(value) {
        if (value && typeof value === "object") {
            this.type = value.type || "min";
            this.values = {
                slot: null,
                day: null,
                week: null,
                month: null,
                ...(value.values || {}),
            };
            this.value = {
                type: this.type,
                values: { ...this.values },
            };
        }

        if (this.initialized) {
            // Update the UI to reflect new values
            const minRadio = document.getElementById(this.getId("type-min"));
            const maxRadio = document.getElementById(this.getId("type-max"));

            if (minRadio && maxRadio) {
                minRadio.checked = this.type === "min";
                maxRadio.checked = this.type === "max";
            }

            // Update the input values
            this.units.forEach((unit) => {
                const input = document.getElementById(
                    this.getId(`input-${unit.value}`),
                );
                if (input) {
                    input.value = this.values[unit.value] || "";
                }
            });
        }
    }

    validate() {
        if (
            this.required &&
            !Object.values(this.values).some((v) => v !== null)
        ) {
            return false;
        }

        if (Object.values(this.values).some((v) => v !== null && v < 1)) {
            return false;
        }

        return this.validators.every((validator) =>
            validator({
                type: this.type,
                values: this.values,
            }),
        );
    }
}
