import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentTeachers extends BaseConstraint {
    static ID = "DIFFERENT_TEACHERS";

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
        wrapper.className = "different-teachers-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Ensure that sessions are assigned to different teachers.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Teachers Rule, if selected</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Each session must be assigned to a different teacher</li>
                <li>• The scheduling system will enforce different teachers for each session</li>
                <li>• Useful for ensuring teaching diversity or parallel sessions</li>
                <li>• Teachers cannot be assigned to multiple sessions in this set</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // No events needed for this flag-based constraint
    }

    getValue() {
        return { DIFFERENT_TEACHERS: true };
    }

    validate() {
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
