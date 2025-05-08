import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";
import { Filter } from "../../../models/Rule.js";
import { Selector } from "../../../models/Rule.js";

export class OperationBuilderComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            operations: [],
            selectorId: null,
            onOperationChange: (operations) => {},
        };
    }

    async beforeRender() {
        this.operations = this.options.operations || [];
        this.selectorId = this.options.selectorId;
        this.draggedElement = null;
        this.filters = [];

        if (this.selectorId) {
            try {
                const selectorData = await Selector.getWithFiltersById(
                    this.selectorId,
                );
                this.filters = selectorData.filters || [];
            } catch (error) {
                console.error("Error loading selector filters:", error);
                Toast.error("Failed to load selector filters");
            }
        }
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <!-- Operator toolbox -->
                <div class="operator-toolbox flex flex-wrap gap-2 mb-4">
                    <div class="operator bg-indigo-100 px-3 py-2 rounded-md cursor-move" draggable="true" data-operator="union">
                        Union (∪)
                    </div>
                    <div class="operator bg-indigo-100 px-3 py-2 rounded-md cursor-move" draggable="true" data-operator="intersection">
                        Intersection (∩)
                    </div>
                    <div class="operator bg-indigo-100 px-3 py-2 rounded-md cursor-move" draggable="true" data-operator="difference">
                        Difference (-)
                    </div>
                </div>

                ${this.renderFilterPalette()}

                <!-- Operation building area -->
                <div class="operation-builder-area border-2 border-dashed border-gray-300 min-h-[150px] p-4 rounded-md">
                    ${await this.renderOperations()}
                </div>

                <!-- Controls -->
                <div class="flex justify-between">
                    <button id="${this.getId("add-line")}" class="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                        Add Line
                    </button>
                    <button id="${this.getId("clear-operations")}" class="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm">
                        Clear All
                    </button>
                </div>

                <!-- Operation preview -->
                <div id="${this.getId("preview")}" class="mt-4 p-3 bg-gray-50 rounded-md text-sm font-mono whitespace-pre-wrap"></div>
            </div>
        `;

        this.updatePreview();
    }

    renderFilterPalette() {
        if (!this.filters || this.filters.length === 0) {
            return "";
        }

        return `
            <div class="filter-palette mb-4">
                <h3 class="text-sm font-medium mb-2">Available Filters</h3>
                <div class="flex flex-wrap gap-2">
                    ${this.filters
                        .map(
                            (filter) => `
                        <div class="filter bg-blue-100 px-3 py-2 rounded-md cursor-move"
                             draggable="true"
                             data-filter-id="${filter.id}">
                            ${OperationBuilderComponent.formatFilterElementShort(filter)}
                        </div>
                    `,
                        )
                        .join("")}
                </div>
            </div>
        `;
    }

    async renderOperations() {
        if (!this.operations || this.operations.length === 0) {
            return `<div class="operation-line flex items-center gap-2 min-h-[40px] p-2 rounded-md" data-line-index="0"></div>`;
        }

        const lines = [];
        for (
            let lineIndex = 0;
            lineIndex < this.operations.length;
            lineIndex++
        ) {
            const line = this.operations[lineIndex];

            let lineHtml = `<div class="operation-line flex items-center gap-2 min-h-[40px] p-2 rounded-md" data-line-index="${lineIndex}">`;

            for (
                let elementIndex = 0;
                elementIndex < line.length;
                elementIndex++
            ) {
                lineHtml += await this.renderOperationElement(
                    line[elementIndex],
                    lineIndex,
                    elementIndex,
                );
            }

            lineHtml += `</div>`;
            lines.push(lineHtml);
        }

        return lines.join("");
    }

    async renderOperationElement(element, lineIndex, elementIndex) {
        if (element.type === "filter") {
            const filterText =
                await OperationBuilderComponent.formatFilterElement(
                    element.filter,
                );
            return `
                <div class="operation-element filter-element bg-blue-100 px-3 py-2 rounded-md flex items-center"
                     data-line-index="${lineIndex}" data-element-index="${elementIndex}" draggable="true"
                     data-filter-id="${element.filter.id || ""}">
                    <span>${filterText}</span>
                    <button class="remove-element ml-2 text-red-600 hover:text-red-800">×</button>
                </div>
            `;
        } else if (element.type === "operator") {
            return `
                <div class="operation-element operator-element bg-indigo-100 px-3 py-2 rounded-md flex items-center"
                     data-line-index="${lineIndex}" data-element-index="${elementIndex}" draggable="true"
                     data-operator="${element.operator}">
                    <span>${this.getOperatorSymbol(element.operator)}</span>
                    <button class="remove-element ml-2 text-red-600 hover:text-red-800">×</button>
                </div>
            `;
        }

        return "";
    }

    static async formatFilterElement(filter) {
        try {
            if (filter.id) {
                return await Filter.getTextRepresentationById(filter.id);
            } else {
                const resource = filter.resource || "Any";
                const label_key = filter.label_key || "Any";
                const label_value = filter.label_value || "Any";
                const rank =
                    filter.rank === "*" || !filter.rank
                        ? "*"
                        : Array.isArray(filter.rank)
                          ? filter.rank.join(",")
                          : "*";

                return `${resource}[${label_key}:${label_value}]{${rank}}`;
            }
        } catch (error) {
            console.error("Error getting filter representation:", error);
            const resource = filter.resource || "Any";
            const label_key = filter.label_key || "Any";
            const label_value = filter.label_value || "Any";
            const rank =
                filter.rank === "*" || !filter.rank
                    ? "*"
                    : Array.isArray(filter.rank)
                      ? filter.rank.join(",")
                      : "*";

            return `${resource}[${label_key}:${label_value}]{${rank}}`;
        }
    }

    static formatFilterElementShort(filter) {
        const label_key = filter.label_key || filter.label_type || "Any";
        const label_value = filter.label_value || "Any";
        return `${label_key}:${label_value}`;
    }

    getOperatorSymbol(operator) {
        const symbols = {
            union: "∪ Union",
            intersection: "∩ Intersection",
            difference: "- Difference",
        };

        return symbols[operator] || operator;
    }

    static getOperatorCode(operator) {
        const codes = {
            union: "|",
            intersection: "&",
            difference: "-",
        };

        return codes[operator] || operator;
    }

    async bindEvents() {
        this.initDragAndDrop();

        document
            .getElementById(this.getId("add-line"))
            .addEventListener("click", () => {
                this.addNewLine();
            });

        document
            .getElementById(this.getId("clear-operations"))
            .addEventListener("click", () => {
                this.clearOperations();
            });

        this.container.querySelectorAll(".remove-element").forEach((button) => {
            button.addEventListener("click", (e) => {
                const element = e.target.closest(".operation-element");
                const lineIndex = parseInt(element.dataset.lineIndex, 10);
                const elementIndex = parseInt(element.dataset.elementIndex, 10);

                this.removeElement(lineIndex, elementIndex);
            });
        });
    }

    initDragAndDrop() {
        this.container.querySelectorAll(".operator").forEach((operator) => {
            operator.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify({
                        type: "new-operator",
                        operator: operator.dataset.operator,
                    }),
                );
            });
        });

        this.container
            .querySelectorAll(".filter-palette .filter")
            .forEach((filter) => {
                filter.addEventListener("dragstart", (e) => {
                    const filterId = parseInt(filter.dataset.filterId, 10);
                    const filterData = this.filters.find(
                        (f) => f.id === filterId,
                    );

                    if (filterData) {
                        e.dataTransfer.setData(
                            "text/plain",
                            JSON.stringify({
                                type: "new-filter",
                                filterId: filterId,
                                filter: filterData,
                            }),
                        );
                    }
                });
            });

        this.container
            .querySelectorAll(".operation-element")
            .forEach((element) => {
                element.addEventListener("dragstart", (e) => {
                    const lineIndex = parseInt(element.dataset.lineIndex, 10);
                    const elementIndex = parseInt(
                        element.dataset.elementIndex,
                        10,
                    );

                    e.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify({
                            type: "move-element",
                            lineIndex: lineIndex,
                            elementIndex: elementIndex,
                        }),
                    );

                    this.draggedElement = element;
                });

                element.addEventListener("dragend", () => {
                    this.draggedElement = null;
                });
            });

        this.container.querySelectorAll(".operation-line").forEach((line) => {
            line.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                line.classList.add("bg-gray-100");
            });

            line.addEventListener("dragleave", () => {
                line.classList.remove("bg-gray-100");
            });

            line.addEventListener("drop", (e) => {
                e.preventDefault();
                line.classList.remove("bg-gray-100");

                try {
                    const data = JSON.parse(
                        e.dataTransfer.getData("text/plain"),
                    );
                    const lineIndex = parseInt(line.dataset.lineIndex, 10);

                    if (data.type === "new-operator") {
                        this.addOperator(data.operator, lineIndex);
                    } else if (data.type === "move-element") {
                        this.moveElement(
                            data.lineIndex,
                            data.elementIndex,
                            lineIndex,
                        );
                    } else if (data.type === "filter") {
                        this.addFilter(data.filter, lineIndex);
                    } else if (data.type === "new-filter") {
                        this.addFilterById(
                            data.filterId,
                            data.filter,
                            lineIndex,
                        );
                    }
                } catch (error) {
                    console.error("Error handling drop:", error);
                }
            });
        });

        window.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        window.addEventListener("drop", (e) => {
            if (
                !e.target.closest(".operation-line") &&
                this.container.contains(e.target)
            ) {
                e.preventDefault();

                try {
                    const data = JSON.parse(
                        e.dataTransfer.getData("text/plain"),
                    );

                    if (data.type === "filter" || data.type === "new-filter") {
                        const lines =
                            this.container.querySelectorAll(".operation-line");
                        const lastLineIndex = lines.length - 1;

                        if (data.type === "filter") {
                            this.addFilter(data.filter, lastLineIndex);
                        } else {
                            this.addFilterById(
                                data.filterId,
                                data.filter,
                                lastLineIndex,
                            );
                        }
                    }
                } catch (error) {
                    console.error("Error handling global drop:", error);
                }
            }
        });
    }

    addNewLine() {
        const builderArea = this.container.querySelector(
            ".operation-builder-area",
        );
        const lineCount =
            builderArea.querySelectorAll(".operation-line").length;

        const newLine = document.createElement("div");
        newLine.className =
            "operation-line flex items-center gap-2 min-h-[40px] p-2 rounded-md";
        newLine.dataset.lineIndex = lineCount;

        builderArea.appendChild(newLine);

        this.operations.push([]);

        this.initDragAndDrop();

        this.options.onOperationChange([...this.operations]);
        this.updatePreview();
    }

    clearOperations() {
        this.operations = [];

        const builderArea = this.container.querySelector(
            ".operation-builder-area",
        );
        builderArea.innerHTML = `<div class="operation-line flex items-center gap-2 min-h-[40px] p-2 rounded-md" data-line-index="0"></div>`;

        this.initDragAndDrop();

        this.options.onOperationChange([]);
        this.updatePreview();

        Toast.info("Operations cleared");
    }

    addOperator(operatorType, lineIndex) {
        const line = this.operations[lineIndex] || [];

        line.push({
            type: "operator",
            operator: operatorType,
        });

        this.operations[lineIndex] = line;

        this.render().then(() => this.bindEvents());

        this.options.onOperationChange([...this.operations]);
    }

    addFilter(filterData, lineIndex) {
        filterData = Filter.create(filterData).then((filter) => {
            if (!(filter instanceof Filter) || !filter.id) {
                Toast.warning("Cannot add filter without ID to operation");
                console.warn("Attempted to add filter without ID:", filter);
                return;
            }

            const line = this.operations[lineIndex] || [];

            line.push({
                type: "filter",
                filter: filter,
                filterId: filter.id,
            });

            this.operations[lineIndex] = line;

            this.render().then(() => this.bindEvents());

            this.options.onOperationChange([...this.operations]);
        });
    }

    addFilterById(filterId, filterData, lineIndex) {
        if (!filterId) {
            Toast.warning("Cannot add filter without ID to operation");
            console.warn("Attempted to add filter without ID");
            return;
        }

        const line = this.operations[lineIndex] || [];

        line.push({
            type: "filter",
            filter: filterData,
            filterId: filterId,
        });

        this.operations[lineIndex] = line;

        this.render().then(() => this.bindEvents());

        this.options.onOperationChange([...this.operations]);
    }

    moveElement(fromLineIndex, fromElementIndex, toLineIndex) {
        const element = this.operations[fromLineIndex][fromElementIndex];
        this.operations[fromLineIndex].splice(fromElementIndex, 1);
        this.operations[toLineIndex].push(element);
        this.render().then(() => this.bindEvents());
        this.options.onOperationChange([...this.operations]);
    }

    removeElement(lineIndex, elementIndex) {
        this.operations[lineIndex].splice(elementIndex, 1);
        if (
            this.operations[lineIndex].length === 0 &&
            this.operations.length > 1
        ) {
            this.operations.splice(lineIndex, 1);
        }
        this.render().then(() => this.bindEvents());
        this.options.onOperationChange([...this.operations]);
    }

    setOperations(operations) {
        this.operations = Array.isArray(operations) ? operations : [];
        this.render().then(() => this.bindEvents());
        this.options.onOperationChange([...this.operations]);
    }

    reset() {
        this.operations = [];
        this.render().then(() => this.bindEvents());
        this.options.onOperationChange([]);
    }

    async getPreviewText() {
        try {
            if (!this.operations || this.operations.length === 0) {
                return "No operations defined";
            }

            const lines = [];

            for (const line of this.operations) {
                if (line.length === 0) continue;

                const lineText = await this.formatOperationLine(line);
                lines.push(lineText);
            }

            return lines.join("\n");
        } catch (error) {
            console.error("Error generating preview text:", error);
            return "Error generating preview";
        }
    }

    async updatePreview() {
        const previewElement = document.getElementById(this.getId("preview"));
        if (!previewElement) return;

        try {
            const previewText = await this.getPreviewText();
            previewElement.textContent = previewText;
        } catch (error) {
            console.error("Error updating preview:", error);
            previewElement.textContent = "Error generating preview";
        }
    }

    async formatOperationLine(line) {
        if (!line || line.length === 0) return "";

        let result = "";

        for (const element of line) {
            if (element.type === "filter") {
                let filterText;
                const filterId = element.filter.id || element.filterId;

                if (filterId) {
                    try {
                        filterText =
                            await Filter.getTextRepresentationById(filterId);
                    } catch (error) {
                        console.error(
                            "Error getting filter representation:",
                            error,
                        );
                        filterText =
                            await OperationBuilderComponent.formatFilterElement(
                                element.filter,
                            );
                    }
                } else {
                    filterText =
                        await OperationBuilderComponent.formatFilterElement(
                            element.filter,
                        );
                }

                result += filterText;
            } else if (element.type === "operator") {
                result += ` ${OperationBuilderComponent.getOperatorCode(element.operator)} `;
            }
        }

        return result;
    }

    static async formatBackendOperationsToString(backendOperations) {
        if (!backendOperations || backendOperations.length === 0) {
            return "No operations defined";
        }

        const lines = [];

        for (const line of backendOperations) {
            if (line.length === 0) continue;

            let lineText = "";

            for (const element of line) {
                if (
                    typeof element === "string" &&
                    ["|", "&", "-"].includes(element)
                ) {
                    const operatorSymbols = {
                        "|": " | ",
                        "&": " & ",
                        "-": " - ",
                    };
                    lineText += operatorSymbols[element];
                } else {
                    try {
                        const filterId = parseInt(element, 10);
                        const filterText =
                            await Filter.getTextRepresentationById(filterId);
                        lineText += filterText;
                    } catch (error) {
                        console.error(
                            "Error getting filter representation for ID:",
                            element,
                            error,
                        );
                        lineText += `[Filter ${element}]`;
                    }
                }
            }

            lines.push(lineText);
        }

        return lines.join("\n");
    }

    static async formatOperationToString(operations) {
        if (!operations || operations.length === 0) {
            return "No operations defined";
        }

        const lines = [];

        for (const line of operations) {
            if (line.length === 0) continue;

            let lineText = "";

            for (const element of line) {
                if (element.type === "filter") {
                    let filterText;
                    const filterId = element.filter.id || element.filterId;

                    if (filterId) {
                        try {
                            filterText =
                                await Filter.getTextRepresentationById(
                                    filterId,
                                );
                        } catch (error) {
                            console.error(
                                "Error getting filter representation:",
                                error,
                            );
                            filterText =
                                await OperationBuilderComponent.formatFilterElement(
                                    element.filter,
                                );
                        }
                    } else {
                        filterText =
                            await OperationBuilderComponent.formatFilterElement(
                                element.filter,
                            );
                    }

                    lineText += filterText;
                } else if (element.type === "operator") {
                    lineText += ` ${OperationBuilderComponent.getOperatorCode(element.operator)} `;
                }
            }

            lines.push(lineText);
        }

        return lines.join("\n");
    }

    getOperationsForBackend() {
        const result = [];

        for (let i = 0; i < this.operations.length; i++) {
            const line = this.operations[i];
            if (line.length === 0) continue;

            const isOperatorLine =
                line.length === 1 && line[0].type === "operator";

            if (isOperatorLine) {
                result.push([
                    OperationBuilderComponent.getOperatorCode(line[0].operator),
                ]);
            } else {
                const backendLine = [];

                for (const element of line) {
                    if (element.type === "filter") {
                        const filterId = element.filter.id || element.filterId;
                        if (filterId) {
                            backendLine.push(filterId);
                        } else {
                            Toast.error(`Missing filter ID at line ${i + 1}`);
                            console.error("Filter without ID found:", element);
                            continue;
                        }
                    } else if (element.type === "operator") {
                        backendLine.push(
                            OperationBuilderComponent.getOperatorCode(
                                element.operator,
                            ),
                        );
                    }
                }

                if (backendLine.length > 0) {
                    result.push(backendLine);
                }
            }
        }

        return result;
    }
}
