import { BaseConstraint } from "./BaseConstraint.js";
import { DailySlotSelector } from "../inputs/DailySlotSelector.js";

export default class SameDailySlot extends BaseConstraint {
    static ID = "SAME_DAILY_SLOT";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
        this.dailySlotSelector = null;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-daily-slot-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select a daily time slot that must be used for all sessions. Sessions will occur at the same time each day.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-green-50 border border-green-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">Same Daily Slot Rule</h4>
            <ul class="text-sm text-green-600 space-y-1">
                <li>• All sessions will start at exactly the same time each day</li>
                <li>• Useful for regular, recurring sessions</li>
                <li>• Creates consistent scheduling patterns</li>
                <li>• Helps establish routine schedules</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        const slotSelector = new DailySlotSelector(this.editor, {
            startHour: this.globalConfig.calendar.startHour,
            endHour: this.globalConfig.calendar.endHour,
            interval: 30,
            mode: "same",
            label: "Select Daily Time Slot",
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

        this.dailySlotSelector = slotSelector;
        this.components.set("dailySlot", slotSelector);
        wrapper.appendChild(slotSelector.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select exactly one time slot that will be used for all sessions.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    getValue() {
        if (!this.dailySlotSelector) {
            return null;
        }
        const slotSelector = this.components.get("dailySlot");
        return {
            slot: slotSelector ? slotSelector.getValue()[0] : null,
        };
    }

    validate() {
        if (!this.dailySlotSelector) {
            return false;
        }
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
