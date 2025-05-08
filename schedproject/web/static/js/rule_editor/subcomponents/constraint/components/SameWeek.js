import { BaseConstraint } from "./BaseConstraint.js";
import { WeekSelector } from "../components/WeekSelector.js";
import { CalendarSelector } from "../components/CalendarSelector.js";

export default class SameWeek extends BaseConstraint {
    static ID = "SAME_WEEK";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
        this.weekSelector = null;
        this.mainContainer = null;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "same-week-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select a specific week when all sessions must occur.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-green-50 border border-green-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">Same Week Rule</h4>
            <ul class="text-sm text-green-600 space-y-1">
                <li>• All sessions will be scheduled within the same week</li>
                <li>• Useful for intensive week programs or workshops</li>
                <li>• Sessions can occur on different days within the week</li>
                <li>• Helps create focused learning periods</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        this.mainContainer = document.createElement("div");
        this.mainContainer.className = "main-content-container mt-4";
        wrapper.appendChild(this.mainContainer);

        const patterns = document.createElement("div");
        patterns.className = "mt-6 grid grid-cols-2 gap-4";
        patterns.innerHTML = `
            <div class="intensive-week p-4 bg-white rounded-lg border">
                <h5 class="font-medium text-gray-700 mb-2">Intensive Week Pattern</h5>
                <div class="space-y-2 text-sm">
                    <div class="p-2 bg-green-50 rounded">Monday: Introduction (AM)</div>
                    <div class="p-2 bg-green-50 rounded">Tuesday: Core Topics (Full Day)</div>
                    <div class="p-2 bg-green-50 rounded">Wednesday: Workshops (PM)</div>
                    <div class="p-2 bg-green-50 rounded">Thursday: Advanced Topics (Full Day)</div>
                    <div class="p-2 bg-green-50 rounded">Friday: Assessment (AM)</div>
                </div>
            </div>
            <div class="distributed-week p-4 bg-white rounded-lg border">
                <h5 class="font-medium text-gray-700 mb-2">Distributed Week Pattern</h5>
                <div class="space-y-2 text-sm">
                    <div class="p-2 bg-green-50 rounded">Monday: Morning Session</div>
                    <div class="p-2 bg-green-50 rounded">Tuesday: Afternoon Session</div>
                    <div class="p-2 bg-green-50 rounded">Wednesday: Break Day</div>
                    <div class="p-2 bg-green-50 rounded">Thursday: Morning Session</div>
                    <div class="p-2 bg-green-50 rounded">Friday: Afternoon Session</div>
                </div>
            </div>
        `;
        wrapper.appendChild(patterns);

        const guidance = document.createElement("div");
        guidance.className =
            "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg";
        guidance.innerHTML = `
            <h4 class="font-medium text-yellow-800 mb-2">Week Planning Guidelines</h4>
            <div class="grid grid-cols-2 gap-4 text-sm text-yellow-700">
                <div>
                    <h5 class="font-medium mb-2">Student Considerations</h5>
                    <ul class="space-y-1">
                        <li>• Balance workload across days</li>
                        <li>• Include study/practice time</li>
                        <li>• Consider travel requirements</li>
                        <li>• Plan for assignments/homework</li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-medium mb-2">Resource Management</h5>
                    <ul class="space-y-1">
                        <li>• Check room availability</li>
                        <li>• Coordinate with other courses</li>
                        <li>• Consider equipment needs</li>
                        <li>• Plan for staff availability</li>
                    </ul>
                </div>
            </div>
        `;
        wrapper.appendChild(guidance);

        const visualization = document.createElement("div");
        visualization.className = "mt-6 p-4 bg-white border rounded-lg";
        visualization.innerHTML = `
            <h4 class="font-medium text-gray-700 mb-3">Week Overview Example</h4>
            <div class="grid grid-cols-5 gap-2">
                ${["Mon", "Tue", "Wed", "Thu", "Fri"]
                    .map(
                        (day) => `
                    <div class="text-center">
                        <div class="font-medium text-sm text-gray-600 mb-1">${day}</div>
                        <div class="h-24 border rounded-lg bg-gray-50 relative p-1">
                            <div class="absolute w-full h-4 bg-green-100 rounded border border-green-300" style="top: 20%"></div>
                            ${
                                day !== "Wed"
                                    ? `
                                <div class="absolute w-full h-4 bg-green-100 rounded border border-green-300" style="top: 60%"></div>
                            `
                                    : ""
                            }
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
            <div class="text-xs text-gray-500 mt-2 text-center">
                Green blocks represent possible session times across the week
            </div>
        `;
        wrapper.appendChild(visualization);

        this.container.appendChild(wrapper);
    }

    handleCalendarSelection(calendarConfig) {
        this.mainContainer.innerHTML = "";

        const weekSelector = new WeekSelector(this.editor, {
            startDate: calendarConfig.startDate,
            endDate: calendarConfig.endDate,
            exclusions: calendarConfig.exclusions,
            mode: "same",
            label: "Select Week for All Sessions",
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

        this.weekSelector = weekSelector;
        this.components.set("week", weekSelector);
        this.mainContainer.appendChild(weekSelector.render());

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select exactly one week when all sessions will take place.";
        this.mainContainer.appendChild(validationMsg);
    }

    getValue() {
        if (!this.weekSelector) {
            return null;
        }
        const weekSelector = this.components.get("week");
        return {
            week: weekSelector ? weekSelector.getValue()[0] : null,
        };
    }

    validate() {
        if (!this.weekSelector) {
            return false;
        }
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
