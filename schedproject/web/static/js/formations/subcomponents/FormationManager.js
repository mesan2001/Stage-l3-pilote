import { BaseComponent } from "../../components/BaseComponent.js";
import { FormationListComponent } from "./FormationListComponent.js";
import { FormationDetailComponent } from "./FormationDetailComponent.js";
import { Toast } from "../../components/Toast.js";
import { Formation } from "../../models/Formation.js";

export class FormationManager extends BaseComponent {
    getDefaultOptions() {
        return {
            currentFormationId: null,
        };
    }

    async beforeRender() {
        this.createSubcomponents();
    }

    createSubcomponents() {
        this.listContainer = document.createElement("div");
        this.detailContainer = document.createElement("div");

        this.formationList = new FormationListComponent(this.listContainer);
        this.formationDetail = new FormationDetailComponent(
            this.detailContainer,
        );
    }

    async render() {
        this.container.innerHTML = `
            <div class="formation-container bg-white rounded-lg shadow-lg p-6">
                <div class="mb-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold">Formation Management</h2>
                        <button id="${this.getId("list-button")}" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                            Browse Formations
                        </button>
                    </div>
                </div>

                <div id="${this.getId("content-container")}" class="formation-content">
                    <div id="${this.getId("list-view")}" class="hidden"></div>
                    <div id="${this.getId("detail-view")}"></div>
                </div>
            </div>
        `;

        const listView = this.container.querySelector(
            `#${this.getId("list-view")}`,
        );
        const detailView = this.container.querySelector(
            `#${this.getId("detail-view")}`,
        );

        listView.appendChild(this.listContainer);
        detailView.appendChild(this.detailContainer);

        await this.loadInitialView();
    }

    async loadInitialView() {
        try {
            await this.formationList.init();
            await this.formationDetail.init();

            // Only check for formation ID in URL, not in localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const formationId = urlParams.get("formationId");

            if (formationId) {
                this.handleFormationSelected(formationId);
            } else {
                // Otherwise show the list view by default
                this.showListView();
            }
        } catch (error) {
            Toast.error("Failed to initialize formation views", error);
        }
    }

    async bindEvents() {
        const listButton = this.container.querySelector(
            `#${this.getId("list-button")}`,
        );

        if (listButton) {
            listButton.addEventListener("click", () => {
                this.showListView();
            });
        }

        document.addEventListener("formation:selected", (e) => {
            this.handleFormationSelected(e.detail.data);
        });

        document.addEventListener("formation:back-to-list", () => {
            this.showListView();
        });
    }

    showListView() {
        const listView = this.container.querySelector(
            `#${this.getId("list-view")}`,
        );
        const detailView = this.container.querySelector(
            `#${this.getId("detail-view")}`,
        );

        listView.classList.remove("hidden");
        detailView.classList.add("hidden");

        // Update formation list data
        this.formationList.refreshData();
    }

    showDetailView() {
        const listView = this.container.querySelector(
            `#${this.getId("list-view")}`,
        );
        const detailView = this.container.querySelector(
            `#${this.getId("detail-view")}`,
        );

        listView.classList.add("hidden");
        detailView.classList.remove("hidden");
    }

    async handleFormationSelected(formationId) {
        if (this.options.currentFormationId === formationId) {
            this.showDetailView();
            return;
        }

        try {
            console.log("Handling formation selection:", formationId);

            const formation = await Formation.getById(formationId);
            if (!formation) {
                Toast.error("Formation not found");
                return;
            }

            this.options.currentFormationId = formationId;

            // Update URL for shareable links
            const url = new URL(window.location);
            url.searchParams.set("formationId", formationId);
            window.history.pushState({}, "", url);
            // Replace the existing detail component with a new instance
            this.detailContainer.innerHTML = "";
            this.formationDetail = new FormationDetailComponent(
                this.detailContainer,
                {
                    formationId: formationId,
                    formation: null,
                    steps: [],
                },
            );

            // Initialize the new component
            await this.formationDetail.init();

            this.showDetailView();
        } catch (error) {
            console.error("Failed to load formation:", error);
            Toast.error("Failed to load formation", error);
        }
    }
}
