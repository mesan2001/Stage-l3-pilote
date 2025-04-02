import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentWeeklySlot extends BaseConstraint {
    static ID = "DIFFERENT_WEEKLY_SLOT";

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            data: {},
        };
    }

    async beforeRender() {
        await super.beforeRender();
        this.data = this.options.data || {};
        // This constraint is just a flag, no specific data to load
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "different-weekly-slot-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Sessions must occur at different points in the weekly schedule.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Weekly Slots Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Sessions must occur at different points in the weekly schedule</li>
                <li>• Each session will be scheduled on a different day/time combination</li>
                <li>• Considers both day of week and time of day</li>
                <li>• Prevents sessions from occurring at the same weekly time point</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // No events needed for this flag-based constraint
    }

    getValue() {
        // This constraint is just a flag, so we return the preset value
        return { DIFFERENT_WEEKLY_SLOT: true };
    }

    validate() {
        // This constraint is always valid when selected
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
