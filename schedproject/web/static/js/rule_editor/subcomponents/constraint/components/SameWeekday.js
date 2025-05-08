import { BaseConstraint } from "./BaseConstraint.js";
import { WeekdaySelector } from "../components/WeekdaySelector.js";
import { CalendarSelector } from "../components/CalendarSelector.js";

export default class SameWeekday extends BaseConstraint {
    static ID = "SAME_WEEKDAY";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
        this.weekdaySelector = null;
        this.mainContainer = null;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-weekday-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select a specific weekday when all sessions must occur (e.g., every Monday).";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-green-50 border border-green-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">Same Weekday Rule</h4>
            <ul class="text-sm text-green-600 space-y-1">
                <li>• All sessions will occur on the same day of the week</li>
                <li>• Creates consistent weekly patterns</li>
                <li>• Helps establish regular routines</li>
                <li>• Simplifies recurring schedules</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.mainContainer = document.createElement("div");
        this.mainContainer.className = "main-content-container mt-4";
        wrapper.appendChild(this.mainContainer);

        const calendarSelector = new CalendarSelector();
        calendarSelector.init(
            this.mainContainer,
            this.handleCalendarSelection.bind(this),
        );

        const patterns = document.createElement("div");
        patterns.className = "mt-6 grid grid-cols-2 gap-4";
        patterns.innerHTML = `
            <div class="regular-pattern p-4 bg-white rounded-lg border border-green-200">
                <h5 class="font-medium text-green-700 mb-2">Regular Course Schedule</h5>
                <div class="space-y-2 text-sm">
                    <p class="text-gray-600 mb-1">Example: Monday Sessions</p>
                    <div class="p-2 bg-green-50 rounded">Week 1: Monday 10:00 AM</div>
                    <div class="p-2 bg-green-50 rounded">Week 2: Monday 10:00 AM</div>
                    <div class="p-2 bg-green-50 rounded">Week 3: Monday 10:00 AM</div>
                </div>
            </div>
            <div class="split-pattern p-4 bg-white rounded-lg border border-blue-200">
                <h5 class="font-medium text-blue-700 mb-2">Multiple Session Pattern</h5>
                <div class="space-y-2 text-sm">
                    <p class="text-gray-600 mb-1">Example: Wednesday Sessions</p>
                    <div class="p-2 bg-blue-50 rounded">Morning: 9:00 AM - 10:30 AM</div>
                    <div class="p-2 bg-blue-50 rounded">Afternoon: 2:00 PM - 3:30 PM</div>
                    <div class="p-2 bg-blue-50 rounded">Evening: 4:00 PM - 5:30 PM</div>
                </div>
            </div>
        `;
        wrapper.appendChild(patterns);

        const visualization = document.createElement("div");
        visualization.className = "mt-6 p-4 bg-white border rounded-lg";
        visualization.innerHTML = `
            <h4 class="font-medium text-gray-700 mb-3">Monthly Pattern Example</h4>
            <div class="grid grid-cols-7 gap-1">
                ${["M", "T", "W", "T", "F", "S", "S"]
                    .map(
                        (day) => `
                    <div class="text-center font-medium text-sm text-gray-600">${day}</div>
                `,
                    )
                    .join("")}
                ${Array(35)
                    .fill(null)
                    .map(
                        (_, i) => `
                    <div class="aspect-square border rounded-sm p-1 text-xs ${
                        i % 7 === 1
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50"
                    }">
                        ${Math.floor(i / 7) + 1}
                    </div>
                `,
                    )
                    .join("")}
            </div>
            <div class="text-xs text-gray-500 mt-2 text-center">
                Green highlights show the selected weekday across multiple weeks
            </div>
        `;
        wrapper.appendChild(visualization);

        const guidance = document.createElement("div");
        guidance.className =
            "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg";
        guidance.innerHTML = `
            <h4 class="font-medium text-yellow-800 mb-2">Planning Guidelines</h4>
            <div class="grid grid-cols-2 gap-4 text-sm text-yellow-700">
                <div>
                    <h5 class="font-medium mb-2">Advantages</h5>
                    <ul class="space-y-1">
                        <li>• Predictable weekly schedule</li>
                        <li>• Easier room bookings</li>
                        <li>• Consistent planning</li>
                        <li>• Regular attendance patterns</li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-medium mb-2">Considerations</h5>
                    <ul class="space-y-1">
                        <li>• Check holiday impacts</li>
                        <li>• Verify room availability</li>
                        <li>• Consider peak times</li>
                        <li>• Account for term breaks</li>
                    </ul>
                </div>
            </div>
        `;
        wrapper.appendChild(guidance);

        this.container.appendChild(wrapper);
    }

    handleCalendarSelection(calendarConfig) {
        this.mainContainer.innerHTML = "";

        const weekdaySelector = new WeekdaySelector(this.editor, {
            weekDays: calendarConfig.weekDays,
            mode: "same",
            label: "Select Day of Week",
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

        this.weekdaySelector = weekdaySelector;
        this.components.set("weekday", weekdaySelector);
        this.mainContainer.appendChild(weekdaySelector.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select exactly one day of the week for all sessions.";
        this.mainContainer.appendChild(validationMsg);

        const impact = document.createElement("div");
        impact.className = "mt-4 p-3 bg-gray-50 rounded-md";
        impact.innerHTML = `
            <h5 class="font-medium text-gray-700 mb-2">Schedule Impact</h5>
            <div class="text-sm text-gray-600 space-y-1">
                <p>• Sessions will be scheduled only on selected weekday</p>
                <p>• Pattern repeats throughout the term</p>
                <p>• May be affected by holidays or breaks</p>
                <p>• Consider alternate days for missed sessions</p>
            </div>
        `;
        this.mainContainer.appendChild(impact);
    }

    getValue() {
        if (!this.weekdaySelector) {
            return null;
        }
        const weekdaySelector = this.components.get("weekday");
        return {
            weekDay: weekdaySelector ? weekdaySelector.getValue()[0] : null,
        };
    }

    validate() {
        if (!this.weekdaySelector) {
            return false;
        }
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
