import { BaseConstraint } from "./BaseConstraint.js";

export default class Periodic extends BaseConstraint {
    static ID = "PERIODIC";

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
        wrapper.className = "periodic-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Define a periodic interval for session scheduling.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
                <h4 class="font-medium text-blue-800 mb-2">Periodicity Rule</h4>
                <ul class="text-sm text-blue-600 space-y-1">
                    <li>• Sessions will occur one after the other.</li>
                </ul>
            `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    getValue() {
        return { PERIODIC: true };
    }

    validate() {
        return true;
    }
}
