import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Formation } from "../../models/Formation.js";

export class FormationListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            formations: [],
            searchQuery: "",
            currentYear: "",
            years: [],
        };
    }

    async beforeRender() {
        await this.refreshData();
    }

    async refreshData() {
        try {
            const formations = await Formation.getAll();

            const years = [...new Set(formations.map((f) => f.year))]
                .sort()
                .reverse();

            const currentYear =
                this.options.currentYear || (years.length > 0 ? years[0] : "");

            this.setOptions({
                formations,
                years,
                currentYear,
            });

            if (this.initialized) {
                await this.render();
                this.bindEvents();
            }
        } catch (error) {
            Toast.error("Failed to load formations", error);
        }
    }

    async render() {
        this.container.innerHTML = `
            <div class="formation-list-component">
                <div class="mb-4 flex justify-between items-center">
                    <h3 class="text-lg font-medium">Formations</h3>
                    <div class="flex space-x-2">
                        <div class="relative">
                            <input type="text"
                                id="${this.getId("search")}"
                                placeholder="Search formations..."
                                value="${this.options.searchQuery}"
                                class="px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            ${
                                this.options.searchQuery
                                    ? `
                                <button id="${this.getId("clear-search")}" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            `
                                    : ""
                            }
                        </div>

                        <select id="${this.getId("year-filter")}"
                            class="px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">All Years</option>
                            ${this.options.years
                                .map(
                                    (year) => `
                                <option value="${year}" ${year === this.options.currentYear ? "selected" : ""}>
                                    ${year}
                                </option>
                            `,
                                )
                                .join("")}
                        </select>
                    </div>
                </div>

                <div id="${this.getId("formations-container")}" class="space-y-2 max-h-[600px] overflow-y-auto">
                    ${this.renderFormationList()}
                </div>
            </div>
        `;
    }

    renderFormationList() {
        const { formations, searchQuery, currentYear } = this.options;

        if (!formations || formations.length === 0) {
            return '<p class="text-gray-500 p-3">No formations available.</p>';
        }

        // Filter formations based on search query and year
        const filteredFormations = formations.filter((formation) => {
            const matchesSearch =
                !searchQuery ||
                formation.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                formation.formationstructurename
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());

            const matchesYear = !currentYear || formation.year === currentYear;

            return matchesSearch && matchesYear;
        });

        if (filteredFormations.length === 0) {
            return '<p class="text-gray-500 p-3">No formations match your search criteria.</p>';
        }

        return filteredFormations
            .sort((a, b) => {
                // Sort by year (descending) then by name (ascending)
                if (a.year !== b.year) return b.year.localeCompare(a.year);
                return a.name.localeCompare(b.name);
            })
            .map((formation) => {
                const displayName =
                    formation.name ||
                    formation.formationstructurename ||
                    "Unnamed Formation";
                return `
                    <div class="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer formation-item"
                        data-formation-id="${formation.id}">
                        <div class="flex justify-between items-center">
                            <div>
                                <h4 class="font-medium">${displayName}</h4>
                                <div class="text-sm text-gray-500">
                                    ${formation.formationstructurecode ? `<span class="mr-2">Code: ${formation.formationstructurecode}</span>` : ""}
                                    ${formation.year ? `<span>Year: ${formation.year}</span>` : ""}
                                </div>
                            </div>
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                `;
            })
            .join("");
    }

    async bindEvents() {
        // Formation item click events
        this.container.querySelectorAll(".formation-item").forEach((item) => {
            item.addEventListener("click", () => {
                const formationId = item.dataset.formationId;
                this.handleFormationClick(formationId);
            });
        });

        // Search input
        const searchInput = this.container.querySelector(
            `#${this.getId("search")}`,
        );
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.options.searchQuery = e.target.value;
                this.render();
                this.bindEvents();
            });
        }

        // Clear search button
        const clearSearchBtn = this.container.querySelector(
            `#${this.getId("clear-search")}`,
        );
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", () => {
                this.options.searchQuery = "";
                this.render();
                this.bindEvents();
            });
        }

        // Year filter
        const yearFilter = this.container.querySelector(
            `#${this.getId("year-filter")}`,
        );
        if (yearFilter) {
            yearFilter.addEventListener("change", (e) => {
                this.options.currentYear = e.target.value;
                this.render();
                this.bindEvents();
            });
        }
    }

    handleFormationClick(formationId) {
        document.dispatchEvent(
            new CustomEvent("formation:selected", {
                detail: { data: formationId },
            }),
        );
    }
}
