import { BaseConstraint } from "./BaseConstraint.js";
import { WorkloadRangeSelector } from "../components/WorkloadRangeSelector.js";

export default class SessionWorkload extends BaseConstraint {
    static ID = "SESSION_WORKLOAD";

    constructor(editor, container, data) {
        super(editor, container, data);
        this.container = container;
    }

    render() {
        const wrapper = document.createElement("div");
        wrapper.className = "session-workload-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Define the allowed number of sessions per day or week.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Session Workload Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Controls the number of sessions in a time period</li>
                <li>• Helps maintain manageable schedules</li>
                <li>• Prevents overloading specific days/weeks</li>
                <li>• Supports balanced distribution of sessions</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        const workloadSelector = new WorkloadRangeSelector(this.editor, {
            required: true,
            validators: [
                (value) => {
                    if (!value || value.min === null || value.max === null) {
                        return false;
                    }
                    if (value.min > value.max) {
                        return false;
                    }
                    if (value.min < 1) {
                        return false;
                    }
                    return true;
                },
            ],
        });

        this.components.set("workload", workloadSelector);
        wrapper.appendChild(workloadSelector.render());

        const practices = document.createElement("div");
        practices.className =
            "mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg";
        practices.innerHTML = `
            <h4 class="font-medium text-yellow-800 mb-2">Workload Guidelines</h4>
            <div class="grid grid-cols-2 gap-4 text-sm text-yellow-700">
                <div>
                    <h5 class="font-medium mb-2">Daily Patterns</h5>
                    <ul class="space-y-1">
                        <li>• Light: 2-4 sessions</li>
                        <li>• Standard: 4-6 sessions</li>
                        <li>• Intensive: 6-8 sessions</li>
                    </ul>
                </div>
                <div>
                    <h5 class="font-medium mb-2">Weekly Patterns</h5>
                    <ul class="space-y-1">
                        <li>• Light: 6-10 sessions</li>
                        <li>• Standard: 10-15 sessions</li>
                        <li>• Intensive: 15-20 sessions</li>
                    </ul>
                </div>
            </div>
        `;
        wrapper.appendChild(practices);

        this.container.appendChild(wrapper);
    }

    getValue() {
        const workload = this.components.get("workload");
        return {
            scope: workload.getValue().scope,
            value: {
                min: workload.getValue().min,
                max: workload.getValue().max,
            },
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }
}
