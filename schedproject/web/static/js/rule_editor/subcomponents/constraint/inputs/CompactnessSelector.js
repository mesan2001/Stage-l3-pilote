import { BaseInput } from "./BaseInput.js";

export class CompactnessSelector extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            maxSigma: 8,
            slotDuration: 30,
            day: 1,
            month: 1,
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.maxSigma = this.options.maxSigma || 8;
        this.slotDuration = this.options.slotDuration || 30;

        // If value is provided, parse it
        if (this.value && typeof this.value === "object") {
            this.sigma = this.value.sigma;
            this.day = this.value.day || 1;
            this.month = this.value.month || 1;
        } else if (typeof this.value === "number") {
            this.sigma = this.value;
            this.day = this.options.day || 1;
            this.month = this.options.month || 1;
        } else {
            // Default values
            this.sigma = null;
            this.day = this.options.day || 1;
            this.month = this.options.month || 1;
        }
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "compactness-selector space-y-6";

        // Sigma (max gap) control
        const sigmaControl = document.createElement("div");
        sigmaControl.className = "sigma-control space-y-4";
        sigmaControl.innerHTML = `
            <div class="space-y-4">
                <div>
                    <div class="flex justify-between items-center">
                        <label class="block text-sm font-medium text-gray-700">
                            Maximum Gap
                        </label>
                        <span class="text-sm text-gray-500" id="${this.getId("sigma-display")}">
                            ${this.formatDuration(this.sigma)}
                        </span>
                    </div>
                    <input type="range"
                           id="${this.getId("sigma-slider")}"
                           min="0"
                           max="${this.maxSigma}"
                           step="1"
                           value="${this.sigma !== null ? this.sigma : 0}"
                           class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Compact</span>
                        <span>Spread</span>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center">
                        <label class="block text-sm font-medium text-gray-700">
                            Day of Month
                        </label>
                        <span class="text-sm text-gray-500" id="${this.getId("day-display")}">
                            Day ${this.day}
                        </span>
                    </div>
                    <input type="range"
                           id="${this.getId("day-slider")}"
                           min="1"
                           max="31"
                           step="1"
                           value="${this.day}"
                           class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>1</span>
                        <span>31</span>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center">
                        <label class="block text-sm font-medium text-gray-700">
                            Month
                        </label>
                        <span class="text-sm text-gray-500" id="${this.getId("month-display")}">
                            Month ${this.month}
                        </span>
                    </div>
                    <input type="range"
                           id="${this.getId("month-slider")}"
                           min="1"
                           max="12"
                           step="1"
                           value="${this.month}"
                           class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>1</span>
                        <span>12</span>
                    </div>
                </div>
            </div>
        `;

        wrapper.appendChild(sigmaControl);
        this.container.innerHTML = "";
        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Sigma slider events
        const sigmaSlider = document.getElementById(this.getId("sigma-slider"));
        const sigmaDisplay = document.getElementById(
            this.getId("sigma-display"),
        );

        if (sigmaSlider && sigmaDisplay) {
            sigmaSlider.addEventListener("input", (e) => {
                this.sigma = parseInt(e.target.value);
                sigmaDisplay.textContent = this.formatDuration(this.sigma);
                this.updateValue();
            });
        }

        // Day slider events
        const daySlider = document.getElementById(this.getId("day-slider"));
        const dayDisplay = document.getElementById(this.getId("day-display"));

        if (daySlider && dayDisplay) {
            daySlider.addEventListener("input", (e) => {
                this.day = parseInt(e.target.value);
                dayDisplay.textContent = `Day ${this.day}`;
                this.updateValue();
            });
        }

        // Month slider events
        const monthSlider = document.getElementById(this.getId("month-slider"));
        const monthDisplay = document.getElementById(
            this.getId("month-display"),
        );

        if (monthSlider && monthDisplay) {
            monthSlider.addEventListener("input", (e) => {
                this.month = parseInt(e.target.value);
                monthDisplay.textContent = `Month ${this.month}`;
                this.updateValue();
            });
        }
    }

    formatDuration(slots) {
        if (slots === null) return "Not set";
        const minutes = slots * this.slotDuration;
        if (minutes === 0) return "0";
        if (minutes < 60) return `${minutes} minutes`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes === 0
            ? `${hours} hour${hours > 1 ? "s" : ""}`
            : `${hours}h ${remainingMinutes}m`;
    }

    updateValue() {
        this.value = {
            sigma: this.sigma,
            day: this.day,
            month: this.month,
        };
        this.notifyChange("input:change", this.value);
    }

    getValue() {
        return {
            sigma: this.sigma,
            day: this.day,
            month: this.month,
        };
    }

    setValue(value) {
        if (value && typeof value === "object") {
            this.sigma = value.sigma;
            this.day = value.day || 1;
            this.month = value.month || 1;
        } else if (typeof value === "number") {
            this.sigma = value;
            this.day = 1;
            this.month = 1;
        } else {
            this.sigma = null;
            this.day = 1;
            this.month = 1;
        }

        this.value = {
            sigma: this.sigma,
            day: this.day,
            month: this.month,
        };

        if (this.initialized) {
            // Update sliders and displays
            const sigmaSlider = document.getElementById(
                this.getId("sigma-slider"),
            );
            const sigmaDisplay = document.getElementById(
                this.getId("sigma-display"),
            );
            const daySlider = document.getElementById(this.getId("day-slider"));
            const dayDisplay = document.getElementById(
                this.getId("day-display"),
            );
            const monthSlider = document.getElementById(
                this.getId("month-slider"),
            );
            const monthDisplay = document.getElementById(
                this.getId("month-display"),
            );

            if (sigmaSlider && this.sigma !== null) {
                sigmaSlider.value = this.sigma;
            }
            if (sigmaDisplay) {
                sigmaDisplay.textContent = this.formatDuration(this.sigma);
            }

            if (daySlider) {
                daySlider.value = this.day;
            }
            if (dayDisplay) {
                dayDisplay.textContent = `Day ${this.day}`;
            }

            if (monthSlider) {
                monthSlider.value = this.month;
            }
            if (monthDisplay) {
                monthDisplay.textContent = `Month ${this.month}`;
            }
        }
    }

    validate() {
        if (this.required && this.sigma === null) {
            return false;
        }

        if (
            this.sigma !== null &&
            (this.sigma < 0 || this.sigma > this.maxSigma)
        ) {
            return false;
        }

        if (this.day < 1 || this.day > 31) {
            return false;
        }

        if (this.month < 1 || this.month > 12) {
            return false;
        }

        return this.validators.every((validator) => validator(this.getValue()));
    }
}
