import { BaseComponent } from "../../components/BaseComponent.js";
import { Rule } from "../../models/Rule.js";
import { Toast } from "../../components/Toast.js";

export class RuleListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            onRuleSelect: (rule) => {},
            onRuleDelete: (ruleId) => {},
            onClose: () => {},
        };
    }

    async beforeRender() {
        this.rules = [];
        this.selectedRuleId = null;

        await this.loadRules();

        document.addEventListener(
            "rule:saved",
            this.handleRuleSaved.bind(this),
        );
        document.addEventListener(
            "rule:deleted",
            this.handleRuleDeleted.bind(this),
        );
    }

    async loadRules() {
        try {
            this.rules = await Rule.getAll();
            if (this.initialized) {
                await this.render();
                await this.bindEvents();
            }
        } catch (error) {
            console.error("Failed to load rules:", error);
            Toast.error("Failed to load rules", error);
            this.rules = [];
        }
    }

    async render() {
        this.container.innerHTML = `
            <div class="rule-list bg-white p-6 rounded-lg shadow">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Rule List</h2>
                    <div class="flex gap-2">
                        <button id="${this.getId("refresh-rules")}" class="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        <button id="${this.getId("close-button")}" class="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Close
                        </button>
                    </div>
                </div>

                ${this.renderRulesList()}

                <div class="mt-4 flex justify-end">
                    <button id="${this.getId("load-rule")}" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed" ${!this.selectedRuleId ? "disabled" : ""}>
                        Load Selected Rule
                    </button>
                </div>
            </div>
        `;
    }

    renderRulesList() {
        if (this.rules.length === 0) {
            return `
                <div class="text-gray-500 py-8 text-center">
                    No rules found. Create your first rule!
                </div>
            `;
        }

        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Select
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Author
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${this.rules.map((rule) => this.renderRuleRow(rule)).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderRuleRow(rule) {
        const constraintType = rule.constraint?.type || "Unknown";

        return `
            <tr class="hover:bg-gray-50 ${this.selectedRuleId === rule.id ? "bg-indigo-50" : ""}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="radio" name="rule-select" class="rule-select-radio"
                           value="${rule.id}" ${this.selectedRuleId === rule.id ? "checked" : ""}>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${rule.name || "Unnamed Rule"}</div>
                    <div class="text-xs text-gray-500">${this.formatTimestamp(rule.created_at)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${rule.author || "Unknown"}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ${constraintType}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mr-2 view-rule-btn" data-rule-id="${rule.id}">
                        View
                    </button>
                    <button class="text-red-600 hover:text-red-900 delete-rule-btn" data-rule-id="${rule.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return "Unknown date";
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    }

    async bindEvents() {
        const refreshButton = document.getElementById(
            this.getId("refresh-rules"),
        );
        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                this.loadRules();
            });
        }

        const closeButton = document.getElementById(this.getId("close-button"));
        if (closeButton) {
            closeButton.addEventListener("click", () => {
                if (typeof this.options.onClose === "function") {
                    this.options.onClose();
                }
            });
        }

        const loadRuleButton = document.getElementById(this.getId("load-rule"));
        if (loadRuleButton) {
            loadRuleButton.addEventListener("click", () => {
                if (this.selectedRuleId) {
                    this.loadRule(this.selectedRuleId);
                }
            });
        }

        this.container
            .querySelectorAll(".rule-select-radio")
            .forEach((radio) => {
                radio.addEventListener("change", (e) => {
                    this.selectedRuleId = parseInt(e.target.value);

                    const loadButton = document.getElementById(
                        this.getId("load-rule"),
                    );
                    if (loadButton) {
                        loadButton.disabled = false;
                    }

                    this.container
                        .querySelectorAll("tbody tr")
                        .forEach((row) => {
                            row.classList.remove("bg-indigo-50");
                        });
                    e.target.closest("tr").classList.add("bg-indigo-50");
                });
            });

        this.container.querySelectorAll(".view-rule-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const ruleId = parseInt(e.target.dataset.ruleId);
                this.viewRule(ruleId);
            });
        });

        this.container.querySelectorAll(".delete-rule-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const ruleId = parseInt(e.target.dataset.ruleId);
                this.confirmDeleteRule(ruleId);
            });
        });
    }

    async viewRule(ruleId) {
        try {
            const rule = await Rule.getCompleteById(ruleId);

            const detailsContainer = document.createElement("div");
            detailsContainer.className =
                "rule-details bg-white p-4 mt-4 border rounded-lg shadow";

            let constraintInfo = "";
            if (rule.constraint) {
                constraintInfo = `<div class="mt-2">
                    <h4 class="text-sm font-medium text-gray-700">Constraint Type:</h4>
                    <p class="text-sm">${rule.constraint.type || "Unknown"}</p>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">${JSON.stringify(rule.constraint, null, 2)}</pre>
                </div>`;
            }

            detailsContainer.innerHTML = `
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-medium text-gray-900">${rule.name || "Unnamed Rule"}</h3>
                        <button class="close-details px-2 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Close
                        </button>
                    </div>
                    <p class="text-sm text-gray-500">Created: ${this.formatTimestamp(rule.created_at)}</p>

                    <div>
                        <h4 class="text-sm font-medium text-gray-700">Description:</h4>
                        <p class="text-sm">${rule.description || "No description provided"}</p>
                    </div>

                    <div>
                        <h4 class="text-sm font-medium text-gray-700">Author:</h4>
                        <p class="text-sm">${rule.author || "Unknown"}</p>
                    </div>

                    ${constraintInfo}

                    <div class="flex justify-end mt-4">
                        <button class="load-viewed-rule px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Load in Editor
                        </button>
                    </div>
                </div>
            `;

            const existingDetails =
                this.container.querySelector(".rule-details");
            if (existingDetails) {
                existingDetails.remove();
            }

            const ruleListElement = this.container.querySelector(".rule-list");
            if (ruleListElement) {
                ruleListElement.appendChild(detailsContainer);
            }

            const closeDetailsButton =
                detailsContainer.querySelector(".close-details");
            if (closeDetailsButton) {
                closeDetailsButton.addEventListener("click", () => {
                    detailsContainer.remove();
                });
            }

            const loadViewedRuleButton =
                detailsContainer.querySelector(".load-viewed-rule");
            if (loadViewedRuleButton) {
                loadViewedRuleButton.addEventListener("click", () => {
                    this.loadRule(rule.id);
                    detailsContainer.remove();
                });
            }
        } catch (error) {
            console.error("Failed to view rule:", error);
            Toast.error("Failed to load rule details", error);
        }
    }

    confirmDeleteRule(ruleId) {
        const rule = this.rules.find((r) => r.id === ruleId);
        if (!rule) return;

        const ruleName = rule.name || "Unnamed Rule";
        const confirmMessage = `Are you sure you want to delete this rule?\n\nRule: ${ruleName}\n\nThis action cannot be undone.`;

        if (confirm(confirmMessage)) {
            this.deleteRule(ruleId);
        }
    }

    async loadRule(ruleId) {
        try {
            document.dispatchEvent(
                new CustomEvent("rule:load", {
                    detail: { ruleId },
                }),
            );

            if (typeof this.options.onRuleSelect === "function") {
                this.options.onRuleSelect(ruleId);
            }

            if (typeof this.options.onClose === "function") {
                this.options.onClose();
            }

            Toast.success("Rule loaded into editor");
        } catch (error) {
            console.error("Failed to load rule:", error);
            Toast.error("Failed to load rule into editor", error);
        }
    }

    async deleteRule(ruleId) {
        try {
            await Rule.delete(ruleId);

            this.rules = this.rules.filter((rule) => rule.id !== ruleId);

            if (this.selectedRuleId === ruleId) {
                this.selectedRuleId = null;
            }

            await this.render();
            await this.bindEvents();

            document.dispatchEvent(
                new CustomEvent("rule:deleted", {
                    detail: { ruleId },
                }),
            );

            if (typeof this.options.onRuleDelete === "function") {
                this.options.onRuleDelete(ruleId);
            }

            Toast.success("Rule deleted successfully");
        } catch (error) {
            console.error("Failed to delete rule:", error);
            Toast.error("Failed to delete rule", error);
        }
    }

    handleRuleSaved(event) {
        const savedRule = event.detail.rule;
        if (savedRule) {
            this.loadRules();
        }
    }

    handleRuleDeleted() {
        this.loadRules();
    }

    onDestroy() {
        document.removeEventListener("rule:saved", this.handleRuleSaved);
        document.removeEventListener("rule:deleted", this.handleRuleDeleted);
    }
}
