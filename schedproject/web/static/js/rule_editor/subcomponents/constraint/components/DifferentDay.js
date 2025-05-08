import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentDay extends BaseConstraint {
    static ID = "DIFFERENT_DAY";

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
        wrapper.className = "different-day-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "When selected, sessions must occur on different calendar days.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Days Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Each session must occur on a different day</li>
                <li>• Days can be from any week within the allowed period</li>
                <li>• This constraint enforces that all sessions in the set must be scheduled on different days</li>
                <li>• Excludes holidays and other restricted dates</li>
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
        return { DIFFERENT_DAY: true };
    }

    validate() {
        // This constraint is always valid when selected
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
