export class FilterManager {
    constructor(app) {
        this.app = app;
        this.activeFilters = {};
        this.selectedTables = new Set();
        this.filterOptions = {
            text: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
                { label: "Contains", value: "LIKE" },
                { label: "Starts with", value: "LIKE" },
                { label: "Ends with", value: "LIKE" },
            ],
            numeric: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
                { label: "Greater Than", value: ">" },
                { label: "Less Than", value: "<" },
                { label: "Greater Than or Equal", value: ">=" },
                { label: "Less Than or Equal", value: "<=" },
            ],
            date: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
                { label: "After", value: ">" },
                { label: "Before", value: "<" },
                { label: "Between", value: "BETWEEN" },
            ],
            key: [
                { label: "Equals", value: "=" },
                { label: "Not Equals", value: "!=" },
            ],
        };
        this.debounceTimer = null;
        this.previousFilters = null;
        this.includedTables = new Set();
    }

    async init() {
        return this;
    }

    updateSelectedTables(tableName, isSelected) {
        if (isSelected) {
            this.selectedTables.add(tableName);
        } else {
            this.selectedTables.delete(tableName);
        }
    }

    renderUI() {
        this.renderFilterOptions(this.app.ui.currentTable);
    }

    renderFilterOptions(tableName) {
        const filterContainer = document.getElementById("filterContainer");
        if (!filterContainer) {
            console.error("Filter container element not found");
            return;
        }
        filterContainer.innerHTML = "";

        const applyFiltersBtn = document.createElement("button");
        applyFiltersBtn.textContent = "Apply Filters";
        applyFiltersBtn.className =
            "bg-blue-500 text-white px-4 py-2 rounded mb-4";
        applyFiltersBtn.addEventListener("click", () => this.applyFilters());
        filterContainer.appendChild(applyFiltersBtn);

        const bubbleContainer = document.createElement("div");
        bubbleContainer.className = "flex flex-wrap gap-2 mb-4";
        filterContainer.appendChild(bubbleContainer);

        this.addSavedFiltersDropdown(filterContainer);

        this.renderFiltersForTable(tableName, filterContainer);
        this.renderFilterBubbles();
    }

    renderFiltersForTable(tableName, container) {
        const tableDiv = document.createElement("div");
        tableDiv.className = "mb-4 p-4 border border-gray-300 rounded";
        const checkboxid = `includeNoFilter_${tableName}`;
        const h3 = document.createElement("h3");
        h3.className = "text-lg font-bold mb-2";
        h3.textContent = tableName;
        tableDiv.appendChild(h3);

        const div = document.createElement("div");
        div.className = "mb-2";

        const label = document.createElement("label");
        label.className = "inline-flex items-center";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "form-checkbox";
        input.id = checkboxid;
        if (this.includedTables.has(tableName)) {
            input.checked = true;
        }

        input.addEventListener("change", (event) => {
            if (event.target.checked) {
                this.includedTables.add(tableName);
            } else {
                this.includedTables.delete(tableName);
            }
        });

        const span = document.createElement("span");
        span.className = "ml-2";
        span.textContent = "Force include";

        label.appendChild(input);
        label.appendChild(span);
        div.appendChild(label);
        tableDiv.appendChild(div);

        const rowCountSpan = document.createElement("span");
        rowCountSpan.className = "ml-2 text-sm text-gray-600";
        rowCountSpan.id = `rowCount_${tableName}`;
        tableDiv.appendChild(rowCountSpan);

        const updateRowCount = async () => {
            const cachedData =
                await this.app.dataManager.getCurrentTableData(tableName);
            const count = cachedData ? cachedData.length : 0;
            rowCountSpan.textContent = `(${count} rows cached)`;
        };

        updateRowCount();

        document.addEventListener("cacheChanged", async () => {
            console.log("Event received and treated");

            await updateRowCount();
        });

        const tableSchema = this.app.dataManager.schema[tableName];
        if (tableSchema && tableSchema.columns_info) {
            Object.keys(tableSchema.columns_info).forEach((field) => {
                const filterDiv = this.createFilterInput(tableName, field);
                if (filterDiv) {
                    tableDiv.appendChild(filterDiv);
                }
            });
        }

        container.appendChild(tableDiv);
    }

    addSavedFiltersDropdown(container) {
        const select = document.createElement("select");
        select.id = "savedFiltersDropdown";
        select.className = "p-2 border border-gray-300 rounded mb-4 mr-2";
        select.innerHTML = '<option value="">Load Saved Filter</option>';
        select.addEventListener("change", (e) =>
            this.loadSavedFilter(e.target.value),
        );
        container.appendChild(select);

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save Current Filter";
        saveButton.className =
            "bg-purple-500 text-white px-4 py-2 rounded mb-4 mr-2";
        saveButton.addEventListener("click", () => this.saveCurrentFilter());
        container.appendChild(saveButton);

        this.updateSavedFiltersDropdown();
    }

    createFilterInput(tableName, field) {
        const filterDiv = document.createElement("div");
        filterDiv.className = "mb-2";

        const label = document.createElement("label");
        label.textContent = field;
        label.className = "block text-sm font-medium text-gray-700 mb-1";
        filterDiv.appendChild(label);

        const inputGroup = document.createElement("div");
        inputGroup.className = "flex items-center space-x-2";
        filterDiv.appendChild(inputGroup);

        const operatorSelect = document.createElement("select");
        operatorSelect.className =
            "p-2 border border-gray-300 rounded operator-select";
        operatorSelect.dataset.table = tableName;
        operatorSelect.dataset.field = field;
        inputGroup.appendChild(operatorSelect);

        const valueInput = document.createElement("div");
        valueInput.className = "value-input flex-grow";
        inputGroup.appendChild(valueInput);

        const filterType = this.getFilterType(tableName, field);

        this.populateOperatorOptions(operatorSelect, filterType);
        this.createValueInput(valueInput, tableName, field, filterType);

        operatorSelect.addEventListener("change", () =>
            this.debounceFilterChange(tableName, field),
        );

        const valueElement = valueInput.firstChild;
        if (valueElement) {
            valueElement.addEventListener("input", () =>
                this.debounceFilterChange(tableName, field),
            );
        }

        return filterDiv;
    }

    populateOperatorOptions(select, filterType) {
        select.innerHTML = '<option value="">All</option>';
        this.filterOptions[filterType].forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            select.appendChild(optionElement);
        });
    }

    createValueInput(container, tableName, field, filterType) {
        container.innerHTML = "";
        const fieldInfo =
            this.app.dataManager.schema[tableName].columns_info[field];

        if (filterType === "key") {
            this.createSearchableDropdown(container, tableName, field);
        } else {
            const input = document.createElement("input");
            input.className = "w-full p-2 border border-gray-300 rounded mt-2";
            input.type =
                filterType === "numeric"
                    ? "number"
                    : filterType === "date"
                      ? "date"
                      : "text";
            container.appendChild(input);
        }
    }

    renderFilterBubbles() {
        const bubbleContainer = document.querySelector(
            "#filterContainer > div",
        );
        bubbleContainer.innerHTML = "";

        Object.entries(this.activeFilters).forEach(
            ([tableName, tableFilters]) => {
                Object.values(tableFilters).forEach((filter) => {
                    const bubble = document.createElement("div");
                    bubble.className =
                        "bg-blue-200 text-blue-800 px-3 py-1 rounded-full flex items-center mb-2 mr-2";

                    let displayValue = Array.isArray(filter.value)
                        ? filter.value.join(" - ")
                        : filter.value;
                    const spanElement = document.createElement("span");
                    spanElement.textContent = `${tableName}.${filter.column} ${filter.operator} ${displayValue}`;
                    bubble.appendChild(spanElement);

                    const removeButton = document.createElement("button");
                    removeButton.textContent = "×";
                    removeButton.className =
                        "ml-2 text-blue-600 hover:text-blue-800";
                    removeButton.addEventListener("click", () =>
                        this.removeFilter(tableName, filter.column),
                    );
                    bubble.appendChild(removeButton);

                    bubble.title = `Table: ${tableName}\nField: ${filter.column}\nOperator: ${filter.operator}\nValue: ${displayValue}`;

                    bubbleContainer.appendChild(bubble);
                });
            },
        );
    }

    updateSavedFiltersDropdown() {
        const savedFilters = JSON.parse(
            localStorage.getItem("savedFilters") || "[]",
        );
        const dropdown = document.getElementById("savedFiltersDropdown");
        dropdown.innerHTML =
            '<option value="">Load Saved Filter</option>' +
            savedFilters
                .map(
                    (filter, index) =>
                        `<option value="${index}">${filter.name}</option>`,
                )
                .join("");
    }

    createSearchableDropdown(container, tableName, field) {
        const wrapper = document.createElement("div");
        wrapper.className = "relative mt-2";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "w-full z-9 p-2 border border-gray-300 rounded";
        input.placeholder = "Search...";

        const dropdown = document.createElement("ul");
        dropdown.className =
            "absolute w-full bg-white z-10 border border-gray-300 rounded mt-1 max-h-60 overflow-y-auto hidden";

        wrapper.appendChild(input);
        wrapper.appendChild(dropdown);
        container.appendChild(wrapper);

        this.populateSearchableDropdown(input, dropdown, tableName, field);
    }

    debounceFilterChange(tableName, field) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.onFilterChange(tableName, field);
        }, 300);
    }

    onOperatorChange(tableName, field) {
        this.onFilterChange(tableName, field);
    }

    onFilterChange(tableName, field) {
        const operatorSelect = document.querySelector(
            `select[data-table="${tableName}"][data-field="${field}"].operator-select`,
        );
        const valueContainer =
            operatorSelect.parentNode.querySelector(".value-input");
        const valueInput = valueContainer.querySelector("input");

        const operator = operatorSelect.value;
        const value = valueInput.dataset.value || valueInput.value;

        this.addFilter(tableName, field, operator, value);
        this.renderFilterBubbles();
    }

    addFilter(tableName, field, operator, value) {
        console.log(
            `Adding filter: ${tableName}.${field} ${operator} ${value}`,
        );
        if (operator && value) {
            if (!this.activeFilters[tableName]) {
                this.activeFilters[tableName] = {};
            }
            this.activeFilters[tableName][field] = {
                column: field,
                operator,
                value,
            };
        } else {
            if (this.activeFilters[tableName]) {
                delete this.activeFilters[tableName][field];
                if (Object.keys(this.activeFilters[tableName]).length === 0) {
                    delete this.activeFilters[tableName];
                }
            }
        }
        console.log("Current activeFilters:", this.activeFilters);
        this.app.dataManager.clearWatcher();
    }

    removeFilter(tableName, field) {
        if (this.activeFilters[tableName]) {
            delete this.activeFilters[tableName][field];
            if (Object.keys(this.activeFilters[tableName]).length === 0) {
                delete this.activeFilters[tableName];
            }
        }
        this.renderFilterBubbles();
    }

    additionalFilters(filters) {
        this.selectedTables.forEach((tableName) => {
            if (
                !filters[tableName] &&
                !this.app.dataManager.watcher.has(tableName)
            ) {
                filters[tableName] = [];
            }
        });

        if (
            !filters[this.app.ui.currentTable] &&
            !this.app.dataManager.watcher.has(this.app.ui.currentTable)
        ) {
            filters[this.app.ui.currentTable] = [];
        }

        this.includedTables.forEach((tableName) => {
            if (!filters[tableName]) {
                filters[tableName] = [];
            }
        });

        return filters;
    }

    async applyFilters() {
        let filters = this.getActiveFilters();
        filters = this.additionalFilters(filters);
        let filteredData = null;

        console.log(
            "Filters including selected tables:",
            JSON.stringify(filters, null, 2),
        );

        if (JSON.stringify(this.previousFilters) === JSON.stringify(filters)) {
            filteredData = this.app.dataManager.getCurrentData();
            this.app.ui.updateCurrentData(filteredData);
        } else {
            this.previousFilters = JSON.parse(JSON.stringify(filters));

            filteredData =
                await this.app.dataManager.fecthFilteredAndCacheData(filters);
            this.app.ui.updateCurrentData(filteredData);
        }
    }

    getActiveFilters() {
        const filters = {};
        Object.entries(this.activeFilters).forEach(
            ([tableName, tableFilters]) => {
                filters[tableName] = Object.values(tableFilters);
            },
        );
        return filters;
    }

    getFilterType(tableName, field) {
        const fieldInfo =
            this.app.dataManager.schema[tableName].columns_info[field];
        const fieldType = fieldInfo.type;

        if (
            fieldInfo.is_primary_key ||
            this.app.dataManager.isForeignKey(tableName, field)
        ) {
            return "key";
        } else if (
            fieldType === "integer" ||
            fieldType === "numeric" ||
            fieldType === "double precision"
        ) {
            return "numeric";
        } else if (fieldType === "date" || fieldType === "timestamp") {
            return "date";
        }
        return "text";
    }

    async populateKeyOptions(select, tableName, isForeignKey = false) {
        const keyType = isForeignKey ? "foreign key" : "primary key";
        console.log(`Populating ${keyType} options for table: ${tableName}`);
        try {
            const keyData =
                (await this.app.dataManager.getCurrentTableData(tableName)) ||
                [];
            const schema = this.app.dataManager.schema[tableName];

            if (!schema) {
                throw new Error(`Schema not found for table: ${tableName}`);
            }

            const primaryKeyField =
                this.app.dataManager.getPrimaryKeyField(tableName);

            if (!primaryKeyField) {
                throw new Error(
                    `Primary key not found for table: ${tableName}`,
                );
            }

            const reprField =
                this.app.dataManager.getReprField(tableName) || primaryKeyField;

            select.innerHTML = '<option value="">Select a value</option>';
            if (keyData.length > 0) {
                keyData.forEach((item) => {
                    const option = document.createElement("option");
                    option.value = item[primaryKeyField];
                    option.textContent =
                        item[reprField] || item[primaryKeyField];
                    select.appendChild(option);
                });
                console.log(
                    `Populated ${keyData.length} ${keyType} options for ${tableName}`,
                );
            } else {
                console.warn(
                    `No ${keyType} data available for table: ${tableName}`,
                );
            }
        } catch (error) {
            console.error(
                `Error populating ${keyType} options for ${tableName}:`,
                error,
            );
        }
    }

    async populateForeignKeyOptions(select, foreignTable) {
        await this.populateKeyOptions(select, foreignTable, true);
    }

    async populatePrimaryKeyOptions(select, tableName) {
        await this.populateKeyOptions(select, tableName, false);
    }

    saveCurrentFilter() {
        const filterName = prompt("Enter a name for this filter:");
        if (filterName) {
            const savedFilter = {
                name: filterName,
                activeFilters: this.activeFilters,
            };
            let savedFilters = JSON.parse(
                localStorage.getItem("savedFilters") || "[]",
            );
            savedFilters.push(savedFilter);
            localStorage.setItem("savedFilters", JSON.stringify(savedFilters));
            this.updateSavedFiltersDropdown();
        }
    }

    loadSavedFilter(filterIndex) {
        const savedFilters = JSON.parse(
            localStorage.getItem("savedFilters") || "[]",
        );
        const filter = savedFilters[filterIndex];
        if (filter) {
            this.activeFilters = filter.activeFilters;
            this.renderFilterBubbles();
            this.applyFilters();
        }
    }

    async populateSearchableDropdown(input, dropdown, tableName, field) {
        const isForeignKey = this.app.dataManager.isForeignKey(
            tableName,
            field,
        );
        const targetTable = isForeignKey
            ? this.app.dataManager.getForeignKeyTable(tableName, field)
            : tableName;
        const keyData =
            (await this.app.dataManager.getCurrentTableData(targetTable)) || [];
        const schema = this.app.dataManager.schema[targetTable];

        if (!schema) {
            console.error(`Schema not found for table: ${targetTable}`);
            return;
        }

        const primaryKeyField =
            this.app.dataManager.getPrimaryKeyField(targetTable);
        const reprField =
            this.app.dataManager.getReprField(targetTable) || primaryKeyField;

        const populateDropdown = (filter = "") => {
            dropdown.innerHTML = "";
            const filteredData = keyData.filter((item) =>
                item[reprField]
                    .toString()
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
            );

            filteredData.forEach((item) => {
                const li = document.createElement("li");
                li.className = "p-2 hover:bg-gray-100 cursor-pointer";
                li.textContent = item[reprField];
                li.dataset.value = item[primaryKeyField];
                dropdown.appendChild(li);
            });

            dropdown.classList.toggle("hidden", filteredData.length === 0);
        };

        input.addEventListener("focus", () => {
            populateDropdown();
            dropdown.classList.remove("hidden");
        });

        input.addEventListener("blur", () => {
            setTimeout(() => dropdown.classList.add("hidden"), 200);
        });

        input.addEventListener("input", () => {
            populateDropdown(input.value);
        });

        dropdown.addEventListener("click", (e) => {
            if (e.target.tagName === "LI") {
                input.value = e.target.textContent;
                input.dataset.value = e.target.dataset.value;
                dropdown.classList.add("hidden");
                this.onFilterChange(tableName, field);
            }
        });
    }
}
