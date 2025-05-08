import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentWeekday extends BaseConstraint {
    static ID = "DIFFERENT_WEEKDAY";

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
        wrapper.className = "different-weekday-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Sessions will be scheduled on different days of the week.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Weekdays Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Sessions will be scheduled on different days of the week</li>
                <li>• This ensures sessions are automatically spread across different weekdays</li>
                <li>• The scheduler will assign sessions to different weekdays</li>
                <li>• No manual selection needed - this rule is applied automatically</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // No events needed for this flag-based constraint
    }

    getValue() {
        return { DIFFERENT_WEEKDAY: true };
    }

    validate() {
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
