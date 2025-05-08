import { BaseConstraint } from "./BaseConstraint.js";
import { GenericChain } from "../inputs/GenericChain.js";
import { Classroom } from "../../../../models/Classroom.js";

export default class AllowedRooms extends BaseConstraint {
    static ID = "ALLOWED_ROOMS";

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            data: {},
        };
    }

    async beforeRender() {
        await super.beforeRender();
        await Classroom.init();
        this.data = this.options.data || {};
        this.components = new Map();
        this.containsCatalogConstraint = ["forbidden_rooms"];
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "allowed-rooms-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select rooms that will be allowed for the sessions. Sessions can only be scheduled in these rooms.";
        wrapper.appendChild(description);

        const roomSelectorContainer = document.createElement("div");
        wrapper.appendChild(roomSelectorContainer);

        const roomSelector = new GenericChain(roomSelectorContainer, {
            model: Classroom,
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "building",
            placeholder: "Search for rooms...",
            label: "Allowed Rooms",
            required: true,
            validators: [
                (value) => {
                    if (!value || value.length === 0) {
                        return false;
                    }
                    return true;
                },
            ],
        });

        await roomSelector.init();
        this.components.set("rooms", roomSelector);

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select at least one room where sessions will be allowed to take place.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Add event bindings if needed
    }

    getValue() {
        const rooms = this.components.get("rooms");
        return {
            rooms: rooms.getValue(),
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
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
