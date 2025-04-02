import { BaseConstraint } from "./BaseConstraint.js";
import { GenericChain } from "../components/GenericChain.js";
import { SameResourcesMatrix } from "../components/SameResourcesMatrix.js";

export default class SameRooms extends BaseConstraint {
    static ID = "SAME_ROOMS";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-rooms-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select rooms that must be used for all sessions in the set. All sessions must take place in the same room(s).";
        wrapper.appendChild(description);

        const matrix = new SameResourcesMatrix(this.editor, {
            apiUrl: "/api/classrooms",
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "building",
            placeholder: "Search for rooms...",
            label: "Same Rooms Matrix",
            required: true,
        });

        this.components.set("matrix", matrix);
        wrapper.appendChild(matrix.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Configure which sessions must share the same rooms.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    getValue() {
        const matrix = this.components.get("matrix");
        return {
            rooms: matrix.getValue(),
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
