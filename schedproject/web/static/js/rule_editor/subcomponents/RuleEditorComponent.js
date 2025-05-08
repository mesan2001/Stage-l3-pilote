import { BaseComponent } from "../../components/BaseComponent.js";
import { Rule, Selector } from "../../models/Rule.js";
import { Toast } from "../../components/Toast.js";
import { ConstraintTypeSelectorComponent } from "./constraint/ConstraintTypeSelectorComponent.js";
import { ConstraintLoaderComponent } from "./constraint/ConstraintLoaderComponent.js";
import { SelectorManager } from "./selector/SelectorManagerComponent.js";
import { RuleMetadataComponent } from "./RuleMetadataComponent.js";
import { ModalComponent } from "../../components/ModalComponent.js";
import { RuleListComponent } from "./RuleListComponent.js";
import { SelectorListComponent } from "./selector/SelectorListComponent.js";

export class RuleEditorComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            ruleId: null,
            onSave: (rule) => {},
            onCancel: () => {},
        };
    }

    async beforeRender() {
        this.rule = null;
        this.selectors = [];
        this.constraint = null;
        this.metadata = {
            name: "",
            description: "",
            author: "",
        };

        document.addEventListener(
            "selector:selected",
            this.handleSelectorSelected.bind(this),
        );
        document.addEventListener(
            "selector:created",
            this.handleSelectorCreated.bind(this),
        );
        document.addEventListener(
            "selector:remove",
            this.handleSelectorRemove.bind(this),
        );
        document.addEventListener(
            "constraint:changed",
            this.handleConstraintChanged.bind(this),
        );

        document.addEventListener("rule:load", this.handleRuleLoad.bind(this));

        if (this.options.ruleId) {
            await this.loadRule(this.options.ruleId);
        }

        this.modalContainer = document.createElement("div");
        document.body.appendChild(this.modalContainer);
        this.modal = new ModalComponent(this.modalContainer);

        this.ruleListModalContainer = document.createElement("div");
        document.body.appendChild(this.ruleListModalContainer);
        this.ruleListModal = new ModalComponent(this.ruleListModalContainer);
    }

    async render() {
        this.container.innerHTML = `
            <div class="rule-editor">
                <h1 class="text-2xl font-bold mb-4">Rule Editor</h1>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Selector Section -->
                    <div class="selector-section">
                        <h2 class="text-xl font-semibold mb-2">Selectors</h2>
                        <!-- Selector List Component -->
                        <div id="${this.getId("selector-list-container")}" class="bg-white p-4 rounded-lg shadow mb-4"></div>
                        <div id="${this.getId("selector-container")}" class="bg-white p-4 rounded-lg shadow"></div>
                    </div>

                    <!-- Constraint Section -->
                    <div class="constraint-section">
                        <h2 class="text-xl font-semibold mb-2">Constraint</h2>
                        <div id="${this.getId("constraint-type-container")}" class="mb-4"></div>
                        <div id="${this.getId("constraint-container")}" class="bg-white p-4 rounded-lg shadow"></div>
                    </div>
                </div>

                <!-- Rule Summary -->
                <div class="rule-summary mt-6 bg-gray-50 p-4 rounded-lg">
                    <h2 class="text-lg font-semibold mb-2">Rule Summary</h2>
                    <div id="${this.getId("summary-container")}" class="text-gray-700"></div>
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-4 mt-6">
                    <button id="${this.getId("clear-button")}" class="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-md hover:bg-yellow-300">
                        Clear Form
                    </button>
                    <button id="${this.getId("load-button")}" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Load Rule
                    </button>
                    <button id="${this.getId("cancel-button")}" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button id="${this.getId("save-button")}" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Save Rule
                    </button>
                </div>
            </div>
        `;
    }

    async afterRender() {
        this.selectorManager = new SelectorManager(
            document.getElementById(this.getId("selector-container")),
            { autoLoad: true },
        );
        await this.selectorManager.init();

        this.selectorListComponent = new SelectorListComponent(
            document.getElementById(this.getId("selector-list-container")),
            { selectors: this.selectors },
        );
        await this.selectorListComponent.init();

        this.constraintTypeSelector = new ConstraintTypeSelectorComponent(
            document.getElementById(this.getId("constraint-type-container")),
            { editor: this },
        );
        await this.constraintTypeSelector.init();

        this.constraintLoader = new ConstraintLoaderComponent(
            document.getElementById(this.getId("constraint-container")),
            { editor: this },
        );
        await this.constraintLoader.init();

        const metadataContainer = document.createElement("div");
        this.metadataComponent = new RuleMetadataComponent(metadataContainer, {
            editor: this,
        });
        await this.metadataComponent.init();

        this.ruleListComponent = new RuleListComponent(
            document.createElement("div"),
            {
                onRuleSelect: (ruleId) => this.loadRule(ruleId),
                onRuleDelete: (ruleId) => {
                    // Clear form if the current rule was deleted
                    if (this.rule && this.rule.id === ruleId) {
                        this.clearForm();
                    }
                },
                onClose: () => this.ruleListModal.close(),
            },
        );
        await this.ruleListComponent.init();

        if (this.rule) {
            this.updateSummary();

            if (this.rule.name) this.metadata.name = this.rule.name;
            if (this.rule.description)
                this.metadata.description = this.rule.description;
            if (this.rule.author) this.metadata.author = this.rule.author;
        }
    }

    async bindEvents() {
        document
            .getElementById(this.getId("save-button"))
            .addEventListener("click", () => {
                this.showSaveModal();
            });

        document
            .getElementById(this.getId("cancel-button"))
            .addEventListener("click", () => {
                this.options.onCancel();
            });

        document
            .getElementById(this.getId("clear-button"))
            .addEventListener("click", () => {
                this.clearForm();
            });

        document
            .getElementById(this.getId("load-button"))
            .addEventListener("click", () => {
                this.showRuleList();
            });
    }

    async loadRule(ruleId) {
        try {
            this.rule = await Rule.getCompleteById(ruleId);

            this.selectors = [];

            const selectors = await Rule.getSelectorsForRule(ruleId);
            if (selectors && selectors.length > 0) {
                for (const selector of selectors) {
                    const selectorDetails = await Selector.getWithFiltersById(
                        selector.id,
                    );
                    this.selectors.push(selectorDetails);
                }
            }

            if (this.selectorListComponent) {
                this.selectorListComponent.setSelectors(this.selectors);
            }

            if (this.rule.constraint) {
                const constraintType = this.getConstraintTypeFromData(
                    this.rule.constraint,
                );
                if (constraintType && this.constraintTypeSelector) {
                    await this.constraintTypeSelector.selectConstraintType(
                        constraintType,
                    );
                    await this.constraintLoader.loadConstraintComponent(
                        constraintType,
                        this.rule.constraint,
                    );
                }
            }

            if (this.metadataComponent) {
                this.metadataComponent.setMetadata({
                    name: this.rule.name,
                    description: this.rule.description,
                    author: this.rule.author,
                });

                this.metadata = {
                    name: this.rule.name || "",
                    description: this.rule.description || "",
                    author: this.rule.author || "",
                };
            }

            this.updateSummary();

            if (this.ruleListModal) {
                this.ruleListModal.close();
            }
        } catch (error) {
            Toast.error("Failed to load rule", error);
        }
    }

    handleSelectorSelected(event) {
        const selector = event.detail.data;
        const exists = this.selectors.some((s) => s.id === selector.id);
        if (!exists) {
            this.selectors.push(selector);

            if (this.selectorListComponent) {
                this.selectorListComponent.setSelectors(this.selectors);
            }

            this.updateSummary();
            Toast.success(
                `Selector "${selector.name || "Unnamed"}" added to rule`,
            );
        } else {
            Toast.warning("This selector is already added to the rule");
        }
    }

    handleSelectorCreated(event) {
        const selector = event.detail.data;
        this.handleSelectorSelected({ detail: { data: selector } });
    }

    handleSelectorRemove(event) {
        const selectorId = event.detail.selectorId;
        this.selectors = this.selectors.filter((s) => s.id !== selectorId);

        if (this.selectorListComponent) {
            this.selectorListComponent.setSelectors(this.selectors);
        }

        this.updateSummary();
        Toast.info("Selector removed from rule");
    }

    handleConstraintChanged(event) {
        this.constraint = event.detail.data;
        this.updateSummary();
    }

    handleRuleLoad(event) {
        const ruleId = event.detail.ruleId;
        if (ruleId) {
            this.loadRule(ruleId);
        }
    }

    updateSummary() {
        const summaryContainer = document.getElementById(
            this.getId("summary-container"),
        );
        if (!summaryContainer) return;

        let summary = "";

        if (this.selectors && this.selectors.length > 0) {
            summary += `<div class="mb-2"><strong>Selectors (${this.selectors.length}):</strong></div>`;
            summary += `<ul class="list-disc pl-5 mb-3">`;
            this.selectors.forEach((selector) => {
                summary += `<li>${selector.name || "Unnamed selector"}</li>`;
            });
            summary += `</ul>`;
        } else {
            summary += `<div class="mb-2 text-yellow-600">No selectors selected</div>`;
        }

        if (this.constraint) {
            summary += `<div class="mb-2"><strong>Constraint:</strong> ${this.constraintTypeSelector.getSelectedType()}</div>`;
        } else {
            summary += `<div class="mb-2 text-yellow-600">No constraint configured</div>`;
        }

        if (this.metadata.name) {
            summary += `<div class="mb-2"><strong>Name:</strong> ${this.metadata.name}</div>`;
        }

        summaryContainer.innerHTML = summary;
    }

    async showRuleList() {
        await this.ruleListComponent.init();
        this.modal = new ModalComponent(
            document.getElementById("modal-container"),
            {
                title: "Load Rules",
                content: this.ruleListComponent,
            },
        );

        this.modal.open();
    }

    clearForm() {
        // Reset the rule
        this.rule = null;
        this.selectors = [];
        this.constraint = null;
        this.metadata = {
            name: "",
            description: "",
            author: "",
        };

        if (this.selectorManager) {
            this.selectorManager.resetComponents();
        }

        if (this.selectorListComponent) {
            this.selectorListComponent.setSelectors([]);
        }

        if (this.constraintTypeSelector) {
            this.constraintTypeSelector.selectConstraintType("");
        }

        if (this.metadataComponent) {
            this.metadataComponent.setMetadata(this.metadata);
        }

        this.updateSummary();

        Toast.info("Form cleared");
    }

    showSaveModal() {
        if (!this.validateRuleComponents()) {
            return;
        }

        this.metadataComponent.setMetadata(this.metadata);

        this.modal = new ModalComponent(this.modalContainer, {
            title: "Save Rule",
            content: this.metadataComponent.getContainer(),
            buttons: [
                {
                    text: "Cancel",
                    handler: (e, modal) => modal.close(),
                },
                {
                    text: "Save Rule",
                    handler: (e, modal) => this.saveRule(),
                },
            ],
        });

        this.modal.open();
    }

    validateRuleComponents() {
        if (!this.selectors || this.selectors.length === 0) {
            Toast.warning("Please select at least one selector");
            return false;
        }

        if (!this.constraintTypeSelector.getSelectedType()) {
            Toast.warning("Please select a constraint type");
            return false;
        }

        if (!this.constraintLoader.validateConstraint()) {
            Toast.warning("Please complete constraint configuration");
            return false;
        }

        return true;
    }

    async saveRule() {
        try {
            const metadata = this.metadataComponent.getMetadata();
            console.log(metadata);
            if (!this.metadataComponent.validate()) {
                Toast.warning("Please provide required rule metadata");
                return;
            }

            this.metadata = metadata;

            const constraintData =
                this.constraintLoader.getCurrentConstraintData();
            const constraintType =
                this.constraintTypeSelector.getSelectedType();

            let ruleData = {
                name: metadata.name,
                description: metadata.description,
                author: metadata.author,
                constraint: {
                    type: constraintType,
                    ...constraintData,
                },
            };

            const selectorIds = this.selectors.map((s) => s.id);

            let savedRule;

            if (this.rule && this.rule.id) {
                ruleData.id = this.rule.id;
                savedRule = await Rule.create(ruleData);

                await savedRule.updateSelectors(selectorIds);
            } else {
                savedRule = await Rule.createWithSelectors(
                    ruleData,
                    selectorIds,
                );
            }

            Toast.success("Rule saved successfully");
            this.modal.close();

            document.dispatchEvent(
                new CustomEvent("rule:saved", {
                    detail: { rule: savedRule },
                }),
            );

            this.options.onSave(savedRule);
        } catch (error) {
            Toast.error("Failed to save rule", error);
        }
    }

    getConstraintTypeFromData(constraintData) {
        return constraintData.type || Object.keys(constraintData)[0];
    }

    onDestroy() {
        document.removeEventListener(
            "selector:selected",
            this.handleSelectorSelected,
        );
        document.removeEventListener(
            "selector:created",
            this.handleSelectorCreated,
        );
        document.removeEventListener(
            "selector:remove",
            this.handleSelectorRemove,
        );
        document.removeEventListener(
            "constraint:changed",
            this.handleConstraintChanged,
        );
        document.removeEventListener("rule:load", this.handleRuleLoad);

        if (this.modalContainer && this.modalContainer.parentNode) {
            this.modalContainer.parentNode.removeChild(this.modalContainer);
        }

        if (
            this.ruleListModalContainer &&
            this.ruleListModalContainer.parentNode
        ) {
            this.ruleListModalContainer.parentNode.removeChild(
                this.ruleListModalContainer,
            );
        }
    }
}
