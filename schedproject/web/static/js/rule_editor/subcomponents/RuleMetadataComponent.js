import { BaseComponent } from "../../components/BaseComponent.js";

export class RuleMetadataComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            editor: null,
            required: true,
        };
    }

    async beforeRender() {
        const savedAuthor = localStorage.getItem("ruleMakerAuthor") || "";

        this.metadata = {
            name: "",
            description: "",
            author: savedAuthor,
        };
    }

    async render() {
        this.container.innerHTML = `
            <div class="rule-metadata p-4">
                <h3 class="text-lg font-semibold mb-3">Rule Information</h3>

                <div class="space-y-4">
                    <div>
                        <label for="${this.getId("rule-name")}" class="block text-sm font-medium text-gray-700 mb-1">
                            Rule Name <span class="text-red-500">*</span>
                        </label>
                        <input type="text"
                               id="${this.getId("rule-name")}"
                               value="${this.metadata.name}"
                               class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>

                    <div>
                        <label for="${this.getId("rule-description")}" class="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea id="${this.getId("rule-description")}"
                                  rows="3"
                                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">${this.metadata.description}</textarea>
                    </div>

                    <div>
                        <label for="${this.getId("rule-author")}" class="block text-sm font-medium text-gray-700 mb-1">
                            Author
                        </label>
                        <input type="text"
                               id="${this.getId("rule-author")}"
                               value="${this.metadata.author}"
                               class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        this.unbindEvents();

        const nameInput = document.getElementById(this.getId("rule-name"));
        const descInput = document.getElementById(
            this.getId("rule-description"),
        );
        const authorInput = document.getElementById(this.getId("rule-author"));

        this.listeners = {};

        if (nameInput) {
            this.listeners.nameInput = () => {
                this.metadata.name = nameInput.value.trim();
            };
            nameInput.addEventListener("input", this.listeners.nameInput);
        }

        if (descInput) {
            this.listeners.descInput = () => {
                this.metadata.description = descInput.value.trim();
            };
            descInput.addEventListener("input", this.listeners.descInput);
        }

        if (authorInput) {
            this.listeners.authorInput = () => {
                this.metadata.author = authorInput.value.trim();
                localStorage.setItem(
                    "ruleMakerAuthor",
                    authorInput.value.trim(),
                );
            };
            authorInput.addEventListener("input", this.listeners.authorInput);
        }
    }

    unbindEvents() {
        if (!this.listeners) return;

        const nameInput = document.getElementById(this.getId("rule-name"));
        const descInput = document.getElementById(
            this.getId("rule-description"),
        );
        const authorInput = document.getElementById(this.getId("rule-author"));

        if (nameInput && this.listeners.nameInput) {
            nameInput.removeEventListener("input", this.listeners.nameInput);
        }

        if (descInput && this.listeners.descInput) {
            descInput.removeEventListener("input", this.listeners.descInput);
        }

        if (authorInput && this.listeners.authorInput) {
            authorInput.removeEventListener(
                "input",
                this.listeners.authorInput,
            );
        }
    }

    setMetadata(metadata = {}) {
        this.metadata = {
            ...this.metadata,
            ...metadata,
        };

        if (this.initialized) {
            const nameInput = document.getElementById(this.getId("rule-name"));
            const descInput = document.getElementById(
                this.getId("rule-description"),
            );
            const authorInput = document.getElementById(
                this.getId("rule-author"),
            );

            if (nameInput) nameInput.value = this.metadata.name || "";
            if (descInput) descInput.value = this.metadata.description || "";
            if (authorInput) authorInput.value = this.metadata.author || "";

            this.bindEvents();
        }
    }

    getMetadata() {
        if (this.initialized) {
            const nameInput = document.getElementById(this.getId("rule-name"));
            const descInput = document.getElementById(
                this.getId("rule-description"),
            );
            const authorInput = document.getElementById(
                this.getId("rule-author"),
            );

            if (nameInput) this.metadata.name = nameInput.value.trim();
            if (descInput) this.metadata.description = descInput.value.trim();
            if (authorInput) this.metadata.author = authorInput.value.trim();
        }

        return { ...this.metadata };
    }

    validate() {
        if (this.options.required && !this.metadata.name) {
            return false;
        }
        return true;
    }

    getContainer() {
        return this.container;
    }
}
