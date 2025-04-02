import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";
import { Filter } from "../../../models/Rule.js";

export class FilterListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            filters: [],
            onFilterUse: (filter) => {},
            onFilterRemove: (filter) => {},
        };
    }

    async beforeRender() {
        this.filters = this.options.filters || [];

        document.addEventListener(
            "filter:created",
            this.handleFilterCreated.bind(this),
        );
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h4 class="text-md font-medium">Available Filters</h4>
                    <button id="${this.getId("clear-all")}" class="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        Clear All
                    </button>
                </div>

                <div id="${this.getId("filter-list")}" class="border rounded-md p-3 min-h-[100px] max-h-[250px] overflow-y-auto">
                    ${await this.renderFilterList()}
                </div>

                <div class="text-xs text-gray-500">
                    <p>Drag filters to use them in operations</p>
                </div>
            </div>
        `;
    }

    async renderFilterList() {
        if (this.filters.length === 0) {
            return `<div class="text-gray-500 text-sm">No filters available</div>`;
        }

        const filterItems = await Promise.all(
            this.filters.map(async (filter, index) =>
                this.renderFilterItem(filter, index),
            ),
        );

        return `
            <div class="space-y-2">
                ${filterItems.join("")}
            </div>
        `;
    }

    async renderFilterItem(filter, index) {
        // Get the text representation using the Filter model method
        let filterText = "Loading...";
        try {
            filterText = await filter.getTextRepresentation();
        } catch (error) {
            console.error("Error getting filter text representation:", error);
            filterText = "Error loading filter";
        }

        return `
            <div class="filter-item bg-blue-50 p-2 rounded-md flex justify-between items-center"
                 data-index="${index}" draggable="true">
                <div class="text-sm">
                    ${filterText}
                </div>
                <div>
                    <button class="remove-filter text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">
                        ×
                    </button>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        const clearAllBtn = document.getElementById(this.getId("clear-all"));
        if (clearAllBtn) {
            clearAllBtn.addEventListener("click", () => this.clearAllFilters());
        }

        const filterListEl = document.getElementById(this.getId("filter-list"));

        filterListEl.querySelectorAll(".use-filter").forEach((button) => {
            button.addEventListener("click", (e) => {
                const filterItem = e.target.closest(".filter-item");
                const index = parseInt(filterItem.dataset.index, 10);
                this.useFilter(index);
            });
        });

        filterListEl.querySelectorAll(".remove-filter").forEach((button) => {
            button.addEventListener("click", (e) => {
                const filterItem = e.target.closest(".filter-item");
                const index = parseInt(filterItem.dataset.index, 10);
                this.removeFilter(index);
            });
        });

        filterListEl.querySelectorAll(".filter-item").forEach((item) => {
            item.addEventListener("dragstart", (e) => {
                const index = parseInt(item.dataset.index, 10);
                e.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify({
                        type: "filter",
                        filter: this.filters[index],
                    }),
                );

                item.classList.add("bg-blue-100");
            });

            item.addEventListener("dragend", () => {
                item.classList.remove("bg-blue-100");
            });
        });
    }

    handleFilterCreated(event) {
        const filter = event.detail.data;
        if (filter && filter instanceof Filter) {
            this.addFilter(filter);
        }
    }

    async addFilter(filter) {
        const newFilter =
            filter instanceof Filter ? filter : new Filter(filter);

        this.filters.push(newFilter);

        document.getElementById(this.getId("filter-list")).innerHTML =
            await this.renderFilterList();
        this.bindEvents();

        Toast.success("Filter added to list");
    }

    useFilter(index) {
        const filter = this.filters[index];
        if (filter) {
            this.options.onFilterUse(filter);
            Toast.info("Filter loaded to editor");
        }
    }

    async removeFilter(index) {
        const filter = this.filters[index];
        this.filters.splice(index, 1);

        document.getElementById(this.getId("filter-list")).innerHTML =
            await this.renderFilterList();
        this.bindEvents();

        if (filter) {
            this.options.onFilterRemove(filter);
        }

        Toast.info("Filter removed from list");
    }

    async clearAllFilters() {
        if (this.filters.length === 0) {
            return;
        }

        this.filters = [];
        document.getElementById(this.getId("filter-list")).innerHTML =
            await this.renderFilterList();
        Toast.info("All filters cleared");
    }

    getFilters() {
        return [...this.filters];
    }

    onDestroy() {
        document.removeEventListener(
            "filter:created",
            this.handleFilterCreated,
        );
    }
}
