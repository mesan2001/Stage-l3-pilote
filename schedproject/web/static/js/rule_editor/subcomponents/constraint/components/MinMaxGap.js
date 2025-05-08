import { BaseConstraint } from "./BaseConstraint.js";
import { GapSelector } from "../inputs/GapSelector.js";

export default class MinMaxGap extends BaseConstraint {
    static ID = "MINMAXGAP";

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            data: {},
        };
    }

    async beforeRender() {
        await super.beforeRender();
        this.data = this.options.data || {};
        this.components = new Map();
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "minmax-gap-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Set minimum and maximum gaps between consecutive sessions. This helps control spacing between sessions.";
        wrapper.appendChild(description);

        const infoBox = document.createElement("div");
        infoBox.className =
            "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md";
        infoBox.innerHTML = `
            <h4 class="font-medium text-blue-800 mb-2">Gap Control Rule</h4>
            <ul class="text-sm text-blue-600 space-y-1">
                <li>• Define minimum required gap between sessions</li>
                <li>• Helps ensure adequate breaks between sessions</li>
                <li>• Prevents sessions from being scheduled too close together</li>
                <li>• Maintains reasonable spacing in the schedule</li>
            </ul>
        `;
        wrapper.appendChild(infoBox);

        const minGapSelectorContainer = document.createElement("div");
        wrapper.appendChild(minGapSelectorContainer);

        const minGapSelector = new GapSelector(minGapSelectorContainer, {
            label: "Minimum Gap",
            type: "min",
            required: true,
            validators: [
                (value) => {
                    return true; // Add more validation if needed
                },
            ],
            data: this.data.minGap,
        });

        await minGapSelector.init();
        this.components.set("minGap", minGapSelector);

        const maxGapSelectorContainer = document.createElement("div");
        wrapper.appendChild(maxGapSelectorContainer);

        const maxGapSelector = new GapSelector(maxGapSelectorContainer, {
            label: "Maximum Gap",
            type: "max",
            required: true,
            validators: [
                (value) => {
                    return true; // Add more validation if needed
                },
            ],
            data: this.data.maxGap,
        });

        await maxGapSelector.init();
        this.components.set("maxGap", maxGapSelector);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Add event bindings if needed
    }

    getValue() {
        const minGap = this.components.get("minGap");
        const maxGap = this.components.get("maxGap");
        return {
            minGap: minGap ? minGap.getValue() : null,
            maxGap: maxGap ? maxGap.getValue() : null,
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }

    onDestroy() {
        this.components.forEach((component) => {
            if (component.destroy && typeof component.destroy === "function") {
                component.destroy();
            }
        });
        this.components.clear();
    }
}
