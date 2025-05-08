import { BaseComponent } from "../../../../components/BaseComponent.js";

export class BaseConstraint extends BaseComponent {
    getDefaultOptions() {
        return {
            data: {},
        };
    }

    async beforeRender() {
        this.data = this.options.data || {};
        this.components = new Map();
        this.validationMessages = new Map();
        this.containsCatalogConstraint = [];
    }

    async render() {
        const wrapper = document.createElement("div");
        wrapper.className = "constraint-wrapper p-4";

        const validationContainer = document.createElement("div");
        validationContainer.className = "validation-messages mt-2";
        validationContainer.id = this.getId("validation-container");
        this.validationContainer = validationContainer;

        wrapper.appendChild(validationContainer);
        this.container.appendChild(wrapper);
    }

    getValue() {
        const values = {};
        this.components.forEach((component, key) => {
            values[key] = component.getValue();
        });
        return values;
    }

    validate() {
        let isValid = true;
        this.validationContainer.innerHTML = "";

        this.components.forEach((component, key) => {
            const componentValid = component.validate();
            if (!componentValid) {
                isValid = false;
                const message = document.createElement("div");
                message.className = "text-red-500 text-sm mt-1";
                message.textContent = `Invalid ${key}: Please check your input`;
                this.validationContainer.appendChild(message);
            }
        });

        return isValid;
    }

    onDestroy() {
        // Clean up components
        this.components.forEach((component) => {
            if (component.destroy && typeof component.destroy === "function") {
                component.destroy();
            }
        });
        this.components.clear();
    }
}
