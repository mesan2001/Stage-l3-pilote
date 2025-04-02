import { BaseConstraint } from "./BaseConstraint.js";

export default class Sequenced extends BaseConstraint {
    static ID = "SEQUENCED";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "sequenced-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Define sequences of sessions that must run in a specific order.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">About Sequences</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Each sequence must contain at least 2 sessions</li>
                <li>• Sessions will be scheduled in the order specified</li>
                <li>• Multiple sequences can be defined</li>
                <li>• Each session in a sequence must finish before the next can start</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.container.appendChild(wrapper);
    }

    getValue() {
        const sequences = this.components.get("sequences");
        return {
            sequences: sequences.getValue(),
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
