import { BaseConstraint } from "./BaseConstraint.js";
import { WeekGridSelector } from "../components/WeekGridSelector.js";

export default class SameSlot extends BaseConstraint {
    static ID = "SAME_SLOT";
    constructor(editor, container, data) {
        super(editor, container, data);

        this.weekGridSelector = null;
        this.mainContainer = null;
    }

    render() {
        this.container.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "allowed-grids-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select allowed time slots for sessions using the weekly grid view.";
        wrapper.appendChild(description);

        this.mainContainer = document.createElement("div");
        this.mainContainer.className = "main-content-container mt-4";
        wrapper.appendChild(this.mainContainer);
        console.log(this.globalConfig);
        const gridSelector = new WeekGridSelector(this.editor, {
            startHour: this.globalConfig.calendar.startHour,
            endHour: this.globalConfig.calendar.endHour,
            weekDays: this.globalConfig.calendar.weekDays,
            startDate: this.globalConfig.calendar.startDate,
            endDate: this.globalConfig.calendar.endDate,
            exclusions: this.globalConfig.calendar.exclusions,
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

        this.weekGridSelector = gridSelector;
        this.components.set("gridSelector", gridSelector);
        this.mainContainer.appendChild(gridSelector.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select at least one grid slot where sessions will be allowed.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    getValue() {
        if (!this.weekGridSelector) {
            return null;
        }
        const gridSelector = this.components.get("gridSelector");
        return {
            slots: gridSelector ? gridSelector.getValue() : [],
        };
    }

    validate() {
        if (!this.weekGridSelector) {
            return false;
        }
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
