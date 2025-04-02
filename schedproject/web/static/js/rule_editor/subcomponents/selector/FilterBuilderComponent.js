import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";
import { Filter } from "../../../models/Rule.js";
import { Labels } from "../../../models/Label.js";

export class FilterBuilderComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            filter: null,
            onFilterCreate: (filter) => {},
        };
    }

    async beforeRender() {
        this.resource_types = [];
        this.label_keys = [];
        this.label_values = [];
        this.rank = [];

        this.currentFilter = this.options.filter || new Filter();

        await this.loadFilterOptions();
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-medium">Build Filter</h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                        <select id="${this.getId("resource-type")}" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="">Any Resource Type</option>
                            ${this.resource_types
                                .map(
                                    (type) =>
                                        `<option value="${type}" ${this.currentFilter.resource_type === type ? "selected" : ""}>${type}</option>`,
                                )
                                .join("")}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Label Key</label>
                        <select id="${this.getId("label-key")}" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="">Any Label Key</option>
                            ${this.label_keys
                                .map(
                                    (key) =>
                                        `<option value="${key}" ${this.currentFilter.label_key === key ? "selected" : ""}>${key}</option>`,
                                )
                                .join("")}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Label Value</label>
                        <select id="${this.getId("label-value")}" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="">Any Label Value</option>
                            ${this.label_values
                                .map(
                                    (value) =>
                                        `<option value="${value}" ${this.currentFilter.label_value === value ? "selected" : ""}>${value}</option>`,
                                )
                                .join("")}
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                    <div id="${this.getId("rank")}" class="border rounded-md p-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <input type="radio" id="${this.getId("all-rank")}" name="rank" value="all"
                                    ${Array.isArray(this.rank) && this.rank.length === 0 ? "checked" : ""}>
                                <label for="${this.getId("all-rank")}">All Rank</label>
                            </div>
                            <div class="flex items-center space-x-2">
                                <input type="radio" id="${this.getId("selected-rank")}" name="rank" value="selected"
                                    ${Array.isArray(this.rank) && this.rank.length > 0 ? "checked" : ""}>
                                <label for="${this.getId("selected-rank")}">Selected Rank</label>
                            </div>
                        </div>

                        <div id="${this.getId("session-selector")}" class="mt-3 ${Array.isArray(this.rank) && this.rank.length === 0 ? "hidden" : ""}">
                            <div class="flex flex-wrap gap-2">
                                ${Array.from({ length: 20 }, (_, i) => i + 1)
                                    .map(
                                        (num) => `
                                    <label class="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200
                                            ${Array.isArray(this.rank) && this.rank.includes(num) ? "bg-indigo-100 text-indigo-800" : ""}">
                                        <input type="checkbox" class="hidden session-checkbox" value="${num}"
                                            ${Array.isArray(this.rank) && this.rank.includes(num) ? "checked" : ""}>
                                        ${num}
                                    </label>
                                `,
                                    )
                                    .join("")}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-3">
                    <button id="${this.getId("create-filter")}" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                        Create Filter
                    </button>
                    <button id="${this.getId("reset-filter")}" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                        Reset
                    </button>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        document
            .getElementById(this.getId("resource-type"))
            .addEventListener("change", (e) => {
                this.currentFilter.resource_type = e.target.value || null;
                this.loadFilterOptions("keys");
            });

        document
            .getElementById(this.getId("label-key"))
            .addEventListener("change", (e) => {
                this.currentFilter.label_key = e.target.value || null;
                this.loadFilterOptions("values");
            });

        document
            .getElementById(this.getId("label-value"))
            .addEventListener("change", (e) => {
                this.currentFilter.label_value = e.target.value || null;
            });

        document
            .getElementById(this.getId("all-rank"))
            .addEventListener("change", () => {
                this.rank = [];
                document
                    .getElementById(this.getId("session-selector"))
                    .classList.add("hidden");
            });

        document
            .getElementById(this.getId("selected-rank"))
            .addEventListener("change", () => {
                this.rank = this.getSelectedRank();
                document
                    .getElementById(this.getId("session-selector"))
                    .classList.remove("hidden");
            });

        document.querySelectorAll(".session-checkbox").forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                if (
                    document.getElementById(this.getId("selected-rank")).checked
                ) {
                    this.rank = this.getSelectedRank();
                }
            });
        });

        document
            .getElementById(this.getId("create-filter"))
            .addEventListener("click", () => {
                this.createFilter();
            });

        document
            .getElementById(this.getId("reset-filter"))
            .addEventListener("click", () => {
                this.reset();
            });
    }

    async loadFilterOptions() {
        try {
            const response = await Labels.getPossibleAssociations(
                this.currentFilter.resource_type || null,
                this.currentFilter.label_key || null,
                this.currentFilter.label_value || null,
            );

            this.resource_types = response.resource_types || [];
            this.label_keys = response.label_keys || [];
            this.label_values = response.label_values || [];

            await this.render();
            await this.bindEvents();
        } catch (error) {
            Toast.error("Failed to load filter options", error);

            this.resource_types = [];
            this.label_keys = [];
            this.label_values = [];
        }
    }

    getSelectedRank() {
        const selectedRank = [];
        document
            .querySelectorAll(".session-checkbox:checked")
            .forEach((checkbox) => {
                selectedRank.push(parseInt(checkbox.value, 10));
            });

        return selectedRank.length > 0
            ? selectedRank.sort((a, b) => a - b)
            : [];
    }

    async createFilter() {
        console.log(this.currentFilter);
        this.currentFilter.rank = this.rank;

        try {
            const savedFilter = await this.currentFilter.save();

            const representation = await savedFilter.getTextRepresentation();

            this.notifyChange("filter:created", savedFilter);

            Toast.success(`Filter created: ${representation}`);

            this.currentFilter = new Filter();
            this.rank = [];

            await this.loadFilterOptions();
            await this.render();
            await this.bindEvents();
        } catch (error) {
            Toast.error("Failed to save filter", error);
            console.error("Error saving filter:", error);
        }
    }

    reset() {
        this.currentFilter = new Filter();
        this.rank = [];

        this.loadFilterOptions().then(() => {
            this.render().then(() => this.bindEvents());
        });

        Toast.info("Filter editor reset");
    }

    async setFilter(filter) {
        if (!(filter instanceof Filter)) {
            filter = new Filter(filter);
        }

        this.currentFilter = filter;
        this.rank = filter.rank || [];

        await this.loadFilterOptions();
        await this.render();
        await this.bindEvents();
    }
}
