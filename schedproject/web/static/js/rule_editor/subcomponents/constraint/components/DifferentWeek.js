import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentWeek extends BaseConstraint {
    static ID = "DIFFERENT_WEEK";

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
        wrapper.className = "different-week-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Sessions must occur in different calendar weeks.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Weeks Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Sessions must occur in different calendar weeks</li>
                <li>• Weeks are counted Monday to Friday</li>
                <li>• Sessions will be automatically spread across different weeks</li>
                <li>• Excludes holiday weeks and other restricted periods</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // No events needed for this flag-based constraint
    }

    getValue() {
        return { DIFFERENT_WEEK: true };
    }

    validate() {
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
