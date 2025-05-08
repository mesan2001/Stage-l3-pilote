import { BaseConstraint } from "./BaseConstraint.js";
import { CompactnessSelector } from "../inputs/CompactnessSelector.js";

export default class Compactness extends BaseConstraint {
    static ID = "COMPACTNESS";

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
        wrapper.className = "compactness-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Set the compactness level for session scheduling. This controls how tightly sessions will be scheduled.";
        wrapper.appendChild(description);

        const compactnessSelectorContainer = document.createElement("div");
        wrapper.appendChild(compactnessSelectorContainer);

        const compactnessSelector = new CompactnessSelector(
            compactnessSelectorContainer,
            {
                required: true,
                maxSigma: 8,
                slotDuration: 30,
                value: this.data.compactnessRange || null,
                validators: [
                    (value) => {
                        if (value.sigma === null) return false;
                        if (value.sigma < 0 || value.sigma > 8) return false;
                        return true;
                    },
                ],
            },
        );

        await compactnessSelector.init();
        this.components.set("compactness", compactnessSelector);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {}

    getValue() {
        const compactness = this.components.get("compactness");
        return {
            compactnessRange: compactness ? compactness.getValue() : null,
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
