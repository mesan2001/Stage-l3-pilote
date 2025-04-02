import { BaseConstraint } from "./BaseConstraint.js";
import { WeeklySlotSelector } from "../components/WeeklySlotSelector.js";
import { CalendarSelector } from "../components/CalendarSelector.js";

export default class SameWeeklySlot extends BaseConstraint {
    static ID = "SAME_WEEKLY_SLOT";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
        this.weeklySlotSelector = null;
        this.mainContainer = null;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-weekly-slot-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select a weekly time slot that will be shared by all sessions. All sessions must occur on the same day of the week at the same time.";
        wrapper.appendChild(description);

        this.mainContainer = document.createElement("div");
        this.mainContainer.className = "main-content-container mt-4";
        wrapper.appendChild(this.mainContainer);

        const slotSelector = new WeeklySlotSelector(this.editor, {
            startHour: this.globalConfig.calendar.startHour,
            endHour: this.globalConfig.calendar.endHour,
            weekDays: this.globalConfig.calendar.weekDays,
            interval: this.globalConfig.slotDuration,
            label: "Select Weekly Time Slot",
            required: true,
            validators: [
                (value) => {
                    if (!value || !value.weekDay || !value.time) {
                        return false;
                    }
                    return true;
                },
            ],
        });
        this.mainContainer,
            this.handleCalendarSelection.bind(this),
            this.container.appendChild(wrapper);
    }

    handleCalendarSelection(calendarConfig) {
        this.mainContainer.innerHTML = "";

        const slotSelector = new WeeklySlotSelector({
            startHour: calendarConfig.startHour,
            endHour: calendarConfig.endHour,
            weekDays: calendarConfig.weekDays,
            interval: 30,
            label: "Select Weekly Time Slot",
            required: true,
            validators: [
                (value) => {
                    if (!value || !value.weekDay || !value.time) {
                        return false;
                    }
                    return true;
                },
            ],
        });

        this.weeklySlotSelector = slotSelector;
        this.components.set("weeklySlotSelector", slotSelector);
        this.mainContainer.appendChild(slotSelector.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select both a day of the week and a time that will be common to all sessions.";
        this.mainContainer.appendChild(validationMsg);
    }

    getValue() {
        if (!this.weeklySlotSelector) {
            return null;
        }
        const slotSelector = this.components.get("weeklySlotSelector");
        return slotSelector ? slotSelector.getValue() : null;
    }

    validate() {
        if (!this.weeklySlotSelector) {
            return false;
        }
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
