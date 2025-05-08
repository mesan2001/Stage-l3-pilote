import { BaseConstraint } from "./BaseConstraint.js";
import { SameResourcesMatrix } from "../components/SameResourcesMatrix.js";

export default class SameTeachers extends BaseConstraint {
    static ID = "SAME_TEACHERS";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-teachers-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select teachers that must be assigned to all sessions in the set. All sessions must be taught by the same teacher(s).";
        wrapper.appendChild(description);

        const matrix = new SameResourcesMatrix(this.editor, {
            apiUrl: "/api/lecturers",
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "lastname",
            placeholder: "Search for teachers...",
            label: "Same Teachers Matrix",
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

        this.components.set("matrix", matrix);
        wrapper.appendChild(matrix.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Configure which sessions must share the same teachers.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    getValue() {
        const matrix = this.components.get("matrix");
        return {
            teachers: matrix.getValue(),
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
