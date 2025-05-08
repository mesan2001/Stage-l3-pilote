import { BaseConstraint } from "./BaseConstraint.js";
import { DateSelector } from "../inputs/DateSelector.js";

export default class SameDay extends BaseConstraint {
    static ID = "SAME_DAY";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
        this.dateSelector = null;
        this.mainContainer = null;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-day-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select a specific day when all sessions must occur.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-green-50 border border-green-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">Same Day Rule</h4>
            <ul class="text-sm text-green-600 space-y-1">
                <li>• All sessions will be scheduled on exactly the same day</li>
                <li>• Useful for intensive day programs or workshops</li>
                <li>• Ensures all sessions happen within one day</li>
                <li>• Can have different times within the selected day</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.mainContainer = document.createElement("div");
        this.mainContainer.className = "main-content-container mt-4";
        wrapper.appendChild(this.mainContainer);

        const dateSelector = new DateSelector(this.editor, {
            startDate: this.globalConfig.calendar.startDate,
            endDate: this.globalConfig.calendar.endDate,
            exclusions: this.globalConfig.calendar.exclusions,
            mode: "same",
            label: "Select Day for All Sessions",
            required: true,
            validators: [
                (value) => {
                    if (!value || !value.length) {
                        return false;
                    }
                    return value.length === 1;
                },
            ],
        });

        this.dateSelector = dateSelector;
        this.components.set("date", dateSelector);
        this.mainContainer.appendChild(dateSelector.render());

        this.container.appendChild(wrapper);
    }

    getValue() {
        if (!this.dateSelector) {
            return null;
        }
        const dateSelector = this.components.get("date");
        return {
            date: dateSelector ? dateSelector.getValue()[0] : null,
        };
    }

    validate() {
        if (!this.dateSelector) {
            return false;
        }
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
