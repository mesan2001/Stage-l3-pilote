import { BaseComponent } from "../../../../components/BaseComponent.js";

export class BaseInput extends BaseComponent {
    getDefaultOptions() {
        return {
            label: "",
            required: false,
            validators: [],
            value: null,
        };
    }

    async beforeRender() {
        this.label = this.options.label;
        this.required = this.options.required;
        this.validators = this.options.validators || [];
        this.value = this.options.value;
    }

    async render() {
        // Base render method to be implemented by child classes
        this.container.innerHTML = `<div>Base input - override in child class</div>`;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        if (this.initialized) {
            this.render();
        }
    }

    validate() {
        if (
            this.required &&
            (this.value === null ||
                this.value === undefined ||
                this.value === "")
        ) {
            return false;
        }
        return this.validators.every((validator) => validator(this.value));
    }

    notifyChange() {
        this.notifyChange("input:change", this.getValue());
    }
}
