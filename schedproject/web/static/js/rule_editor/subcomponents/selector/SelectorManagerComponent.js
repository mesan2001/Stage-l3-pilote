import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";
import { ModalComponent } from "../../../components/ModalComponent.js";
import { FilterBuilderComponent } from "./FilterBuilderComponent.js";
import { FilterListComponent } from "./FilterListComponent.js";
import { OperationBuilderComponent } from "./OperationBuilderComponent.js";
import { Selector } from "../../../models/Rule.js";
import { Filter } from "../../../models/Rule.js";

export class SelectorManager extends BaseComponent {
    getDefaultOptions() {
        return {
            autoLoad: true,
        };
    }

    async beforeRender() {
        this.filterBuilder = null;
        this.filterList = null;
        this.operationBuilder = null;
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <h1 class="text-2xl font-bold text-gray-800">Resource Selector</h1>

                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold">Build Selector</h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div id="${this.getId("filter-builder")}"></div>
                        <div id="${this.getId("filter-list")}"></div>
                    </div>

                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-lg font-medium">Operations</h3>
                            <button id="${this.getId("toggle-operations")}" class="text-sm text-indigo-600">
                                <span>Show</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div id="${this.getId("operation-builder")}" class="hidden"></div>
                    </div>

                    <div class="flex justify-end">
                        <div>
                            <button id="${this.getId("save-selector")}" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                                Save Selector
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement("div");
        modalContainer.id = this.getId("modal-container");
        this.container.appendChild(modalContainer);
        this.modal = new ModalComponent(modalContainer);
    }

    async afterRender() {
        this.filterBuilder = new FilterBuilderComponent(
            document.getElementById(this.getId("filter-builder")),
        );
        await this.filterBuilder.init();

        this.filterList = new FilterListComponent(
            document.getElementById(this.getId("filter-list")),
            {
                filters: [],
            },
        );
        await this.filterList.init();

        this.operationBuilder = new OperationBuilderComponent(
            document.getElementById(this.getId("operation-builder")),
        );
        await this.operationBuilder.init();
    }

    async bindEvents() {
        const toggleButton = document.getElementById(
            this.getId("toggle-operations"),
        );
        const operationsContainer = document.getElementById(
            this.getId("operation-builder"),
        );

        toggleButton.addEventListener("click", () => {
            const isHidden = operationsContainer.classList.toggle("hidden");
            const span = toggleButton.querySelector("span");
            span.textContent = isHidden ? "Show" : "Hide";
        });

        document
            .getElementById(this.getId("save-selector"))
            .addEventListener("click", () => this.initiateSelector());
    }

    async initiateSelector() {
        try {
            // Validate the selector data first
            if (!this.validateSelectorData()) {
                return;
            }

            // Show modal to collect selector name
            await this.showSaveSelectorModal();
        } catch (error) {
            console.error("Error initiating selector:", error);
            Toast.error("Failed to prepare selector", error);
        }
    }

    validateSelectorData() {
        const operations = this.operationBuilder.getOperationsForBackend();
        const filters = this.filterList.getFilters();

        // Special case: single filter with no operations is valid
        if ((!operations || operations.length === 0) && filters.length === 1) {
            return true;
        }

        // Otherwise we need operations
        if (!operations || operations.length === 0) {
            Toast.warning("Cannot save a selector with no operations");
            return false;
        }

        return true;
    }

    async showSaveSelectorModal() {
        const operations = this.operationBuilder.getOperationsForBackend();
        const filters = this.filterList.getFilters();

        let selectorText = "";

        if ((!operations || operations.length === 0) && filters.length === 1) {
            if (filters[0].id) {
                selectorText = await filters[0].getTextRepresentation();
            } else {
                selectorText = this.operationBuilder.getPreviewText();
            }
        } else {
            selectorText =
                await OperationBuilderComponent.formatBackendOperationsToString(
                    operations,
                );
        }

        const modalContent = document.createElement("div");
        modalContent.innerHTML = `
            <div class="space-y-4">
                <p>Please provide a name for this selector or use the default.</p>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Selector Name</label>
                    <input type="text" id="selector-name-input" value="${selectorText}" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div class="text-sm text-gray-500">
                    If left empty, the selector will be named by its operation representation.
                </div>
            </div>
        `;

        this.modal.setContent(modalContent);
        this.modal.setTitle("Save Selector");

        const saveBtn = document.createElement("button");
        saveBtn.className =
            "px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm";
        saveBtn.textContent = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.className =
            "px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm";
        cancelBtn.textContent = "Cancel";

        const footer = document.createElement("div");
        footer.className = "flex justify-end space-x-2 mt-4";
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        modalContent.appendChild(footer);

        cancelBtn.addEventListener("click", () => {
            this.modal.close();
        });

        saveBtn.addEventListener("click", async () => {
            const nameInput = document.getElementById("selector-name-input");
            const name = nameInput.value.trim();

            try {
                const savedSelector = await this.saveSelector(name, operations);
                this.modal.close();

                Toast.success("Selector saved successfully");

                const representation = await Selector.getTextRepresentationById(
                    savedSelector.id,
                );
                Toast.info(`Selector representation: ${representation}`);
            } catch (error) {
                Toast.error("Failed to save selector", error);
                console.error("Error saving selector:", error);
            }
        });

        this.modal.open();
    }

    async saveSelector(name, operations) {
        try {
            const filters = this.filterList.getFilters();
            let backendOperations = operations;

            if (
                filters.length === 1 &&
                (!operations || operations.length === 0)
            ) {
                backendOperations = [[filters[0].id]];
            }

            const selectorData = {
                name: name || "",
                operation: backendOperations,
            };

            const selector = await Selector.create(selectorData);

            if (!selector.name) {
                selector.name = await Selector.getTextRepresentationById(
                    selector.id,
                );
                selector = await Selector.update(selector.id, {
                    name: selector.name,
                });
            }

            await this.linkFiltersToSelector(selector.id, filters, operations);

            this.resetComponents();

            document.dispatchEvent(
                new CustomEvent("selector:created", {
                    detail: { data: selector },
                }),
            );

            return selector;
        } catch (error) {
            Toast.error("Failed to save selector", error);
            console.error("Error saving selector:", error);
            return null;
        }
    }

    async linkFiltersToSelector(selectorId, filters, operations) {
        try {
            const usedFilterIds = new Set();

            if (operations && operations.length > 0) {
                operations.forEach((operation) => {
                    if (Array.isArray(operation)) {
                        operation.forEach((item) => {
                            if (typeof item === "number") {
                                usedFilterIds.add(item);
                            }
                        });
                    }
                });
            } else if (filters.length === 1) {
                if (filters[0].id) {
                    usedFilterIds.add(filters[0].id);
                }
            }

            for (const filter of filters) {
                if (filter.id) {
                    if (usedFilterIds.has(filter.id)) {
                        filter.selector_id = selectorId;
                        await filter.save();
                        Toast.info(
                            `Updated filter ${filter.id} with selector ID ${selectorId}`,
                        );
                    } else {
                        await filter.delete();
                        Toast.info(`Deleted unused filter ${filter.id}`);
                    }
                } else {
                    filter.selector_id = selectorId;
                    const savedFilter = await Filter.create(filter.toJSON());
                    filter.id = savedFilter.id;
                    Toast.info(
                        `Created new filter ${filter.id} with selector ID ${selectorId}`,
                    );
                }
            }

            return true;
        } catch (error) {
            Toast.error("Failed to link filters to selector", error);
            console.error("Error linking filters to selector:", error);
            throw error;
        }
    }

    resetComponents() {
        if (this.filterBuilder) {
            this.filterBuilder.reset();
        }

        if (this.filterList) {
            this.filterList.clearAllFilters();
        }

        if (this.operationBuilder) {
            this.operationBuilder.reset();
        }

        Toast.info("All components have been reset");
    }
}
