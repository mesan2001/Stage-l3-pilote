import { BaseConstraint } from "./BaseConstraint.js";
import { GenericChain } from "../inputs/GenericChain.js";
import { Classroom } from "../../../../models/Classroom.js";

export default class ForbiddenRooms extends BaseConstraint {
    static ID = "FORBIDDEN_ROOMS";

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
        // Ensure the Classroom model is initialized
        await Classroom.init();
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "forbidden-rooms-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select rooms that will be forbidden for the sessions. Sessions cannot be scheduled in these rooms.";
        wrapper.appendChild(description);

        const roomSelectorContainer = document.createElement("div");
        wrapper.appendChild(roomSelectorContainer);

        const roomSelector = new GenericChain(roomSelectorContainer, {
            model: Classroom,
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "building",
            placeholder: "Search for rooms...",
            label: "Forbidden Rooms",
            required: true,
            // Populate with existing data if available
            data: this.data.rooms
                ? await this._loadRoomData(this.data.rooms)
                : [],
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
            "Select at least one room where sessions will not be allowed to take place.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    async _loadRoomData(roomIds) {
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return [];
        }

        try {
            const rooms = await Promise.all(
                roomIds.map((id) => Classroom.getById(id)),
            );
            return rooms.filter((room) => room !== null);
        } catch (error) {
            console.error("Error loading room data:", error);
            return [];
        }
    }

    async bindEvents() {
        // Add event bindings if needed
    }

    getValue() {
        const rooms = this.components.get("rooms");
        return {
            rooms: rooms ? rooms.getValue() : [],
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
