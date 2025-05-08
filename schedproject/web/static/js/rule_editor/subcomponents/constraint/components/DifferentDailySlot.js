import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentDailySlot extends BaseConstraint {
    static ID = "DIFFERENT_DAILY_SLOT";

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            data: {},
        };
    }

    async beforeRender() {
        await super.beforeRender();
        this.data = this.options.data || {};
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "different-daily-slot-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "When selected, sessions must occur at different times of day, regardless of the actual date.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Daily Slots Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Each session will be scheduled at a different time of day</li>
                <li>• Sessions can still occur on the same day, but at different hours</li>
                <li>• Prevents repeated scheduling patterns</li>
                <li>• Creates time diversity in your schedule</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {}

    getValue() {
        return { DIFFERENT_DAILY_SLOT: true };
    }

    validate() {
        return true;
    }

    onDestroy() {}
}
