import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";
import { Selector } from "../../../models/Rule.js";

export class SelectorListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            selectors: [],
        };
    }

    async beforeRender() {
        this.selectors = this.options.selectors || [];
    }

    async render() {
        this.container.innerHTML = `
            <div class="selector-list p-3">
                <h3 class="text-md font-medium mb-2">Selected Selectors</h3>
                ${this.renderSelectorList()}
            </div>
        `;
    }

    renderSelectorList() {
        if (!this.selectors || this.selectors.length === 0) {
            return `
                <div class="text-gray-500 py-2 text-sm">
                    No selectors selected. Create or select a selector from below.
                </div>
            `;
        }

        return `
            <div class="space-y-2">
                ${this.selectors
                    .map(
                        (selector, index) => `
                    <div class="selector-item flex justify-between items-center bg-blue-50 p-2 rounded-md" data-selector-id="${selector.id}">
                        <div class="selector-name text-sm font-medium">
                            ${selector.name || `Unnamed Selector ${index + 1}`}
                        </div>
                        <div class="flex space-x-2">
                            <button class="view-selector text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                                View
                            </button>
                            <button class="remove-selector text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                                Remove
                            </button>
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
    }

    async bindEvents() {
        this.container.querySelectorAll(".view-selector").forEach((button) => {
            button.addEventListener("click", (e) => {
                const selectorItem = e.target.closest(".selector-item");
                const selectorId = parseInt(
                    selectorItem.dataset.selectorId,
                    10,
                );
                this.viewSelector(selectorId);
            });
        });

        this.container
            .querySelectorAll(".remove-selector")
            .forEach((button) => {
                button.addEventListener("click", (e) => {
                    const selectorItem = e.target.closest(".selector-item");
                    const selectorId = parseInt(
                        selectorItem.dataset.selectorId,
                        10,
                    );
                    this.removeSelector(selectorId);
                });
            });
    }

    setSelectors(selectors) {
        this.selectors = selectors || [];
        this.render().then(() => this.bindEvents());
    }

    async viewSelector(selectorId) {
        try {
            const selector = await Selector.getWithFiltersById(selectorId);
            const selectorText =
                await Selector.getTextRepresentationById(selectorId);

            Toast.info(
                `Selector: ${selector.name || "Unnamed"}\nRepresentation: ${selectorText}`,
            );
        } catch (error) {
            Toast.error("Failed to load selector details");
            console.error("Error viewing selector:", error);
        }
    }

    removeSelector(selectorId) {
        this.selectors = this.selectors.filter((s) => s.id !== selectorId);

        // Update UI
        this.render().then(() => this.bindEvents());

        document.dispatchEvent(
            new CustomEvent("selector:remove", {
                detail: { selectorId },
            }),
        );
    }
}
