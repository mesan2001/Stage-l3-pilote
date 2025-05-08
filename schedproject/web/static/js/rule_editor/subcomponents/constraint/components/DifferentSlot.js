import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentSlot extends BaseConstraint {
    static ID = "DIFFERENT_SLOT";

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
        wrapper.className = "different-slot-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "This constraint ensures that sessions must be scheduled at different time slots across all days.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Slots Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Sessions must start at different times</li>
                <li>• Time slots must be unique across all days</li>
                <li>• Prevents any overlap at the start of sessions</li>
                <li>• Enforces temporal separation between sessions</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // No events needed for this flag-based constraint
    }

    getValue() {
        return { DIFFERENT_SLOT: true };
    }

    validate() {
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
