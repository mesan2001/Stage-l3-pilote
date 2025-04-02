import { BaseConstraint } from "./BaseConstraint.js";

export default class NoOverlap extends BaseConstraint {
    static ID = "NO_OVERLAP";

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            data: {},
        };
    }

    async beforeRender() {
        await super.beforeRender();
        this.data = this.options.data || {};
        this.components = new Map();
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "no-overlap-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Ensure that sessions do not overlap in time.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">No Overlap Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Sessions cannot occur at the same time</li>
                <li>• A session must end before another can start</li>
                <li>• This prevents scheduling conflicts</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "This constraint will ensure that no two sessions in the set overlap in time.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Add event bindings if needed
    }

    getValue() {
        return { NO_OVERLAP: true };
    }

    validate() {
        return true;
    }

    onDestroy() {
        this.components.forEach((component) => {
            if (component.destroy && typeof component.destroy === "function") {
                component.destroy();
            }
        });
        this.components.clear();
    }
}
