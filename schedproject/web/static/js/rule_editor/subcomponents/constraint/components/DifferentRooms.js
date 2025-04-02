import { BaseConstraint } from "./BaseConstraint.js";

export default class DifferentRooms extends BaseConstraint {
    static ID = "DIFFERENT_ROOMS";

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
        wrapper.className = "different-rooms-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Ensure that sessions are assigned to different rooms.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Different Rooms Rule, if selected</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Each session will be assigned to a different room</li>
                <li>• This constraint enforces that all sessions in the set must be scheduled in different rooms</li>
                <li>• Useful for parallel sessions that must occur in separate locations</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // No events needed for this flag-based constraint
    }

    getValue() {
        return { DIFFERENT_ROOMS: true };
    }

    validate() {
        return true;
    }

    onDestroy() {
        // No special cleanup needed for this component
    }
}
