import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";

export class ConstraintTypeSelectorComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            selectedType: null,
        };
    }

    async beforeRender() {
        this.constraintTypes = [
            { id: "ADJACENT_ROOMS", name: "Adjacent Rooms" },
            { id: "ALLOWED_GRIDS", name: "Allowed Slots" },
            { id: "ALLOWED_ROOMS", name: "Allowed Rooms" },
            { id: "ALLOWED_TEACHERS", name: "Allowed Teachers" },
            { id: "COMPACTNESS", name: "Compactness" },
            { id: "DIFFERENT_DAY", name: "Different Days" },
            { id: "DIFFERENT_DAILY_SLOT", name: "Different Daily Slots" },

            // Add these additional constraint types
            { id: "DIFFERENT_ROOMS", name: "Different Rooms" },
            { id: "DIFFERENT_SLOT", name: "Different Slots" },
            { id: "DIFFERENT_TEACHERS", name: "Different Teachers" },
            { id: "DIFFERENT_WEEK", name: "Different Weeks" },
            { id: "DIFFERENT_WEEKDAY", name: "Different Weekdays" },
            { id: "DIFFERENT_WEEKLY_SLOT", name: "Different Weekly Slots" },
            { id: "FORBIDDEN_ROOMS", name: "Forbidden Rooms" },
            { id: "FORBIDDEN_SLOTS", name: "Forbidden Slots" },
            { id: "FORBIDDEN_TEACHERS", name: "Forbidden Teachers" },
            { id: "MINMAXGAP", name: "Min/Max Gap" },
            { id: "NO_OVERLAP", name: "No Overlap" },
            { id: "PERIODIC", name: "Periodic" },
            { id: "REQUIRED_ROOMS", name: "Required Rooms" },
            { id: "REQUIRED_TEACHERS", name: "Required Teachers" },
            // { id: "SAME_DAILY_SLOT", name: "Same Daily Slot" },
            // { id: "SAME_DAY", name: "Same Day" },
            // { id: "SAME_ROOMS", name: "Same Rooms" },
            // { id: "SAME_SLOT", name: "Same Slot" },
            // { id: "SAME_TEACHERS", name: "Same Teachers" },
            // { id: "SAME_WEEK", name: "Same Week" },
            // { id: "SAME_WEEKDAY", name: "Same Weekday" },
            // { id: "SAME_WEEKLY_SLOT", name: "Same Weekly Slot" },
            { id: "SEQUENCED", name: "Sequenced" },
            // { id: "SESSION_WORKLOAD", name: "Session Workload" },
        ];

        this.selectedType = this.options.selectedType;
    }

    async render() {
        this.container.innerHTML = `
            <div class="constraint-type-selector">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                    Constraint Type
                </label>
                <select id="${this.getId("type-select")}" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select a constraint type</option>
                    ${this.constraintTypes
                        .map(
                            (type) => `
                        <option value="${type.id}" ${this.selectedType === type.id ? "selected" : ""}>
                            ${type.name}
                        </option>
                    `,
                        )
                        .join("")}
                </select>
                <p class="mt-1 text-sm text-gray-500">
                    Select the type of constraint to apply to the selected resources
                </p>
            </div>
        `;
    }

    async bindEvents() {
        const typeSelect = document.getElementById(this.getId("type-select"));
        typeSelect.addEventListener("change", async (e) => {
            const selectedType = e.target.value;
            await this.selectConstraintType(selectedType);
        });
    }

    async selectConstraintType(type) {
        try {
            this.selectedType = type;

            if (this.initialized) {
                const typeSelect = document.getElementById(
                    this.getId("type-select"),
                );
                if (typeSelect) typeSelect.value = type;
            }

            // Notify that constraint type has changed
            this.notifyChange("constraint:type:selected", type);

            return true;
        } catch (error) {
            Toast.error("Failed to select constraint type", error);
            return false;
        }
    }

    getSelectedType() {
        return this.selectedType;
    }
}
