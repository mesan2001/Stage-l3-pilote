import { BaseInput } from "./BaseInput.js";
import { Toast } from "../../../components/Toast.js";

export class SameResourcesMatrix extends BaseInput {
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            model: null, // Model class to use for data loading
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "",
            placeholder: "Search...",
            resourceType: "resource",
        };
    }

    async beforeRender() {
        await super.beforeRender();

        this.model = this.options.model;
        this.searchColumn = this.options.searchColumn;
        this.displayColumn = this.options.displayColumn;
        this.infoColumn = this.options.infoColumn;
        this.placeholder = this.options.placeholder;
        this.resourceType = this.options.resourceType;

        this.resources = [];
        this.selectedResources = new Set();

        // If value is provided, populate the selected resources
        if (Array.isArray(this.value)) {
            this.selectedResources = new Set(this.value);
        }

        // Load resources when initializing
        await this.loadResources();
    }

    async loadResources() {
        if (!this.model) {
            console.warn("No model provided for SameResourcesMatrix");
            return;
        }

        try {
            // Use the model's getAll method to fetch data
            const data = await this.model.getAll();
            this.resources = data;
        } catch (error) {
            console.error("Error loading resources:", error);
            Toast.error(`Failed to load ${this.resourceType}s`, error);
            this.resources = [];
        }
    }

    async render() {
        const container = document.createElement("div");
        container.className = "same-resources-matrix p-4 border rounded-lg";

        // Add label if provided
        if (this.label) {
            const labelElement = document.createElement("label");
            labelElement.className =
                "block text-sm font-medium text-gray-700 mb-2";
            labelElement.textContent = this.label;
            container.appendChild(labelElement);
        }

        const searchContainer = document.createElement("div");
        searchContainer.className = "mb-4";
        searchContainer.innerHTML = `
            <input type="text"
                   id="${this.getId("search-input")}"
                   class="w-full p-2 border rounded-md"
                   placeholder="${this.placeholder}">
        `;

        const gridContainer = document.createElement("div");
        gridContainer.className = "grid grid-cols-2 gap-4";

        const availableContainer = document.createElement("div");
        availableContainer.className = "border rounded-md p-2";
        availableContainer.innerHTML = `
            <h4 class="font-medium mb-2">Available ${this.resourceType.charAt(0).toUpperCase() + this.resourceType.slice(1)}s</h4>
            <div id="${this.getId("available-resources")}" class="available-resources space-y-1 max-h-60 overflow-y-auto"></div>
        `;

        const selectedContainer = document.createElement("div");
        selectedContainer.className = "border rounded-md p-2";
        selectedContainer.innerHTML = `
            <h4 class="font-medium mb-2">Selected ${this.resourceType.charAt(0).toUpperCase() + this.resourceType.slice(1)}s</h4>
            <div id="${this.getId("selected-resources")}" class="selected-resources space-y-1 max-h-60 overflow-y-auto"></div>
        `;

        gridContainer.appendChild(availableContainer);
        gridContainer.appendChild(selectedContainer);

        container.appendChild(searchContainer);
        container.appendChild(gridContainer);

        this.container.innerHTML = "";
        this.container.appendChild(container);

        // Render the resources in their containers
        this.renderResourceLists();
    }

    async bindEvents() {
        const searchInput = document.getElementById(this.getId("search-input"));

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filterResources(e.target.value);
            });
        }

        // Add event delegation for resource items to avoid adding many event listeners
        const availableContainer = document.getElementById(
            this.getId("available-resources"),
        );
        const selectedContainer = document.getElementById(
            this.getId("selected-resources"),
        );

        if (availableContainer) {
            availableContainer.addEventListener("click", (e) => {
                const button = e.target.closest("button");
                if (button) {
                    const item = button.closest(".resource-item");
                    if (item) {
                        const id = parseInt(item.dataset.id);
                        this.addResource(id);
                    }
                }
            });
        }

        if (selectedContainer) {
            selectedContainer.addEventListener("click", (e) => {
                const button = e.target.closest("button");
                if (button) {
                    const item = button.closest(".resource-item");
                    if (item) {
                        const id = parseInt(item.dataset.id);
                        this.removeResource(id);
                    }
                }
            });
        }
    }

    filterResources(query) {
        const availableContainer = document.getElementById(
            this.getId("available-resources"),
        );

        if (!availableContainer) return;

        const filteredResources = this.resources.filter((resource) => {
            // Handle resources as model instances
            const searchValue =
                resource[this.searchColumn]?.toLowerCase() || "";
            return (
                !this.selectedResources.has(resource.id) &&
                searchValue.includes(query.toLowerCase())
            );
        });

        availableContainer.innerHTML = filteredResources
            .map((resource) => this.renderResourceItem(resource, false))
            .join("");
    }

    renderResourceLists() {
        const availableContainer = document.getElementById(
            this.getId("available-resources"),
        );
        const selectedContainer = document.getElementById(
            this.getId("selected-resources"),
        );

        if (!availableContainer || !selectedContainer) return;

        // Render available resources
        const availableResources = this.resources.filter(
            (resource) => !this.selectedResources.has(resource.id),
        );
        availableContainer.innerHTML = availableResources
            .map((resource) => this.renderResourceItem(resource, false))
            .join("");

        // Render selected resources
        const selectedResources = this.resources.filter((resource) =>
            this.selectedResources.has(resource.id),
        );
        selectedContainer.innerHTML = selectedResources
            .map((resource) => this.renderResourceItem(resource, true))
            .join("");
    }

    renderResourceItem(resource, selected = false) {
        return `
            <div class="resource-item flex items-center justify-between p-2 bg-gray-50 rounded-md"
                 data-id="${resource.id}">
                <div>
                    <span class="font-medium">${resource[this.displayColumn] || ""}</span>
                    ${
                        this.infoColumn && resource[this.infoColumn]
                            ? `<span class="text-sm text-gray-500">(${resource[this.infoColumn]})</span>`
                            : ""
                    }
                </div>
                <button class="text-sm px-2 py-1 rounded-md ${
                    selected
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                }">
                    ${selected ? "Remove" : "Add"}
                </button>
            </div>
        `;
    }

    addResource(id) {
        this.selectedResources.add(id);
        this.renderResourceLists();
        this.updateValue();
    }

    removeResource(id) {
        this.selectedResources.delete(id);
        this.renderResourceLists();
        this.updateValue();
    }

    updateValue() {
        this.value = Array.from(this.selectedResources);
        this.notifyChange("input:change", this.value);
    }

    getValue() {
        return Array.from(this.selectedResources);
    }

    setValue(value) {
        if (Array.isArray(value)) {
            this.selectedResources = new Set(value);
            this.value = value;

            if (this.initialized) {
                this.renderResourceLists();
            }
        }
    }

    validate() {
        if (this.required && this.selectedResources.size === 0) {
            return false;
        }

        return this.validators.every((validator) =>
            validator(Array.from(this.selectedResources)),
        );
    }

    // Helper method to search for resources by id - useful with model data
    findResourceById(id) {
        return this.resources.find((resource) => resource.id === id);
    }

    // Method to get the full resource objects for selected resources
    getSelectedResourceObjects() {
        return Array.from(this.selectedResources)
            .map((id) => this.findResourceById(id))
            .filter((resource) => resource !== undefined);
    }
}
