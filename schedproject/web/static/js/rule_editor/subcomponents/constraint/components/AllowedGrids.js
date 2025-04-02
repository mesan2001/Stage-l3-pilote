import { BaseConstraint } from "./BaseConstraint.js";
import { WeekGridSelector } from "../inputs/WeekGridSelector.js";

export default class AllowedGrids extends BaseConstraint {
    static ID = "ALLOWED_GRIDS";

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
        this.weekGridSelector = null;
        this.mainContainer = null;
        this.containsCatalogConstraint = ["allowed_slots", "forbidden_slots"];
    }

    async render() {
        await super.render();

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

        const gridSelector = new WeekGridSelector(this.mainContainer, {
            startHour: this.globalConfig?.calendar?.startHour || 8,
            endHour: this.globalConfig?.calendar?.endHour || 18,
            weekDays: this.globalConfig?.calendar?.weekDays || [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
            ],
            startDate: this.globalConfig?.calendar?.startDate || new Date(),
            endDate:
                this.globalConfig?.calendar?.endDate ||
                new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
            exclusions: this.globalConfig?.calendar?.exclusions || [],
            required: true,
            value: this.data?.slots || [],
            validators: [
                (value) => {
                    if (!value || value.length === 0) {
                        return false;
                    }
                    return true;
                },
            ],
        });

        await gridSelector.init();
        this.weekGridSelector = gridSelector;
        this.components.set("gridSelector", gridSelector);

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select at least one grid slot where sessions will be allowed.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    async bindEvents() {
        // Add event bindings if needed
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

    onDestroy() {
        this.components.forEach((component) => {
            if (component.destroy && typeof component.destroy === "function") {
                component.destroy();
            }
        });
        this.components.clear();
    }
}
