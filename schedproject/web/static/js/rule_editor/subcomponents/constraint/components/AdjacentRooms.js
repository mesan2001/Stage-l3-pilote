import { BaseConstraint } from "./BaseConstraint.js";
import { GenericChain } from "../inputs/GenericChain.js";
import { Classroom } from "../../../../models/Classroom.js";

export default class AdjacentRooms extends BaseConstraint {
    static ID = "ADJACENT_ROOMS";

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
        this.roomChainInput = null;
        this.mainContainer = null;

        await Classroom.init();
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "adjacent-rooms-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Define a chain of adjacent rooms. The rooms will be considered adjacent in the order specified.";
        wrapper.appendChild(description);

        this.mainContainer = document.createElement("div");
        this.mainContainer.className = "main-content-container mt-4";
        wrapper.appendChild(this.mainContainer);

        const roomChainInput = new GenericChain(this.mainContainer, {
            model: Classroom,
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "building",
            placeholder: "Search for rooms...",
            label: "Room Chain",
            required: true,
            data: this.data?.roomChain || [],
            validators: [
                (value) => {
                    if (!value || value.length === 0) {
                        return false;
                    }
                    return true;
                },
                (value) => {
                    if (value.length < 2) {
                        return false;
                    }
                    return true;
                },
            ],
        });

        await roomChainInput.init();
        this.roomChainInput = roomChainInput; // Save a direct reference
        this.components.set("roomChain", roomChainInput);

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select at least 2 rooms and arrange them in the desired order of adjacency.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Empty implementation like in AllowedSlots
    }

    getValue() {
        if (!this.roomChainInput) {
            return null;
        }
        const roomChain = this.components.get("roomChain");
        return {
            roomChain: roomChain ? roomChain.getValue() : [],
        };
    }

    validate() {
        if (!this.roomChainInput) {
            return false;
        }
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
