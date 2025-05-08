import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Formation } from "../../models/Formation.js";
import { StepComponent } from "./StepComponent.js";

export class FormationDetailComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            formationId: null,
            formation: null,
            steps: [],
        };
    }

    async beforeRender() {
        if (this.options.formationId) {
            await this.loadFormationData();
        }
    }

    async loadFormationData() {
        try {
            const formationData = await Formation.getContent(
                this.options.formationId,
            );

            if (!formationData || Object.keys(formationData).length === 0) {
                Toast.error("Formation not found or content is empty");
                return;
            }

            this.options.formation = formationData;
            this.options.steps = formationData.steps || [];

            // Sort steps if they have periodcode that can be compared (assuming format like S1, S2, etc.)
            if (
                this.options.steps.length > 0 &&
                this.options.steps[0].periodcode
            ) {
                this.options.steps.sort((a, b) => {
                    // Try to extract numeric part if format is S1, S2, etc.
                    const aMatch = a.periodcode.match(/\d+/);
                    const bMatch = b.periodcode.match(/\d+/);

                    if (aMatch && bMatch) {
                        return parseInt(aMatch[0]) - parseInt(bMatch[0]);
                    }

                    // Fallback to alphabetical sort
                    return a.periodcode.localeCompare(b.periodcode);
                });
            }
        } catch (error) {
            Toast.error("Failed to load formation content", error);
        }
    }

    async render() {
        if (!this.options.formation) {
            this.container.innerHTML = `
                <div class="text-center p-8 text-gray-500">
                    <p>No formation selected</p>
                </div>
            `;
            return;
        }

        const formation = this.options.formation;

        this.container.innerHTML = `
            <div class="formation-detail-component">
                <div class="flex items-center mb-6">
                    <button id="${this.getId("back-button")}" class="mr-3 text-gray-600 hover:text-gray-900">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h3 class="text-xl font-medium">${formation.name || "Unnamed Formation"}</h3>
                </div>

                <div class="mb-6 bg-gray-50 p-4 rounded-lg">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div>
                            <span class="text-sm text-gray-500">Year</span>
                            <p>${formation.year || "N/A"}</p>
                        </div>
                        <div>
                            <span class="text-sm text-gray-500">Calendar ID</span>
                            <p>${formation.calendar_id || "N/A"}</p>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <h4 class="text-lg font-medium mb-2">Steps</h4>
                    <div id="${this.getId("steps-container")}" class="space-y-6">
                        ${
                            this.options.steps.length > 0
                                ? this.options.steps
                                      .map(
                                          (_, index) =>
                                              `<div id="${this.getId(`step-${index}`)}" class="step-container"></div>`,
                                      )
                                      .join("")
                                : '<p class="text-gray-500">No steps found for this formation.</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        await this.initializeStepComponents();
    }

    async initializeStepComponents() {
        this.stepComponents = [];

        this.options.steps.forEach(async (step, index) => {
            const stepContainer = this.container.querySelector(
                `#${this.getId(`step-${index}`)}`,
            );
            if (!stepContainer) return;

            const stepComponent = new StepComponent(stepContainer);
            stepComponent.setOptions({
                step: step,
                index: index,
            });

            await stepComponent.init();
            this.stepComponents.push(stepComponent);
        });
    }

    async bindEvents() {
        const backButton = this.container.querySelector(
            `#${this.getId("back-button")}`,
        );
        if (backButton) {
            backButton.addEventListener("click", () => {
                this.notifyChange("formation:back-to-list");
            });
        }
    }
}
