export class UI {
    constructor(app) {
        this.app = app;
        this.currentTable = null;
        this.currentData = {};
    }

    async init() {
        try {
            this.setupEventListeners();
            this.renderUI();
            return this;
        } catch (error) {
            console.error("Error initializing UI:", error);
            this.showError(
                "Failed to initialize the application. Please check the console for details.",
            );
        }
    }

    setupEventListeners() {
        document
            .getElementById("tableSelector")
            .addEventListener("change", this.handleTableSelection.bind(this));
        document
            .getElementById("tableCheckboxes")
            .addEventListener(
                "change",
                this.handleTableCheckboxChange.bind(this),
            );
        document
            .getElementById("applyLabelButton")
            .addEventListener("click", () => this.labelManager.applyLabel());
        document
            .getElementById("saveLabelButton")
            .addEventListener("click", () => this.labelManager.saveLabels());

        document
            .getElementById(`tableCheckboxes`)
            .addEventListener("cacheChanged", () => {
                this.updateAllRowCount();
            });

        window.addEventListener(
            "cacheChanged",
            this.updateAllRowCount.bind(this),
        );
    }

    renderUI() {
        this.renderTableSelector();
        this.renderTableCheckboxes();
    }

    renderTableSelector() {
        const selector = document.getElementById("tableSelector");
        if (!selector) {
            console.error("Table selector element not found");
            return;
        }
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.createOption("", "Select a table"));
        Object.keys(this.app.dataManager.schema).forEach((tableName) =>
            fragment.appendChild(this.createOption(tableName, tableName)),
        );
        selector.appendChild(fragment);
    }

    createOption(value, text) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        return option;
    }

    renderTableCheckboxes() {
        const container = document.getElementById("tableCheckboxes");
        if (!container) {
            console.error("Table checkboxes container not found");
            return;
        }
        const fragment = document.createDocumentFragment();
        Object.keys(this.app.dataManager.schema).forEach((tableName) => {
            fragment.appendChild(this.createCheckboxDiv(tableName));
        });
        container.appendChild(fragment);
        this.updateAllRowCount();
    }

    updateAllRowCount() {
        const checkboxes = document.querySelectorAll(
            '#tableCheckboxes input[type="checkbox"]',
        );

        checkboxes.forEach((cb) => {
            this.updateRowCount(cb.associatedTable);
        });
    }

    async updateRowCount(tableName) {
        console.log(`rowCount_${tableName}`);
        const rowCountLabel = document.getElementById(`rowCount_${tableName}`);
        const cachedData =
            await this.app.dataManager.getCurrentTableData(tableName);
        const count = cachedData ? cachedData.length : 0;
        rowCountLabel.textContent = `${tableName} (${count} element(s))`;
    }

    createCheckboxDiv(tableName) {
        const div = document.createElement("div");
        div.className = "flex items-center";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-${tableName}`;
        checkbox.className = "mr-2";
        checkbox.dataset.table = tableName;
        const label = document.createElement("label");

        label.className = "ml-2 text-sm text-gray-600";
        label.id = `rowCount_${tableName}`;
        label.textContent = tableName;
        checkbox.associatedTable = tableName;

        label.htmlFor = checkbox.id;
        div.appendChild(checkbox);
        div.appendChild(label);
        return div;
    }

    handleTableSelection(event) {
        const tableName = event.target.value;
        if (tableName) this.setCurrentTable(tableName);
    }

    handleTableCheckboxChange(event) {
        if (event.target.type === "checkbox") {
            const { table: tableName } = event.target.dataset;
            const isChecked = event.target.checked;
            this.app.filterManager.updateSelectedTables(tableName, isChecked);
            this.app.networkManager.updateGraphWithFilteredData();
        }
    }

    async setCurrentTable(tableName) {
        try {
            this.currentTable = tableName;
            if (this.app.dataManager.watcher.has(tableName)) {
                await this.app.dataManager.getCurrentTableData(tableName);
            } else {
                await this.app.filterManager.applyFilters();
            }
            this.app.filterManager.renderFilterOptions(tableName);
        } catch (error) {
            console.error("Error setting current table:", error);
            this.showError(
                `Failed to load data for table ${tableName}. Please try again.`,
            );
        }
    }

    updateCurrentData(filteredData) {
        console.log("Selected tables: ", this.app.filterManager.selectedTables);
        this.app.networkManager.updateGraphWithFilteredData();

        if (Object.keys(this.currentData).length === 0) {
            console.warn("No data matches the current filters");
            this.showNotification("No data matches the current filters");
            this.disableLabeling();
        } else {
            this.enableLabeling();
        }

        if (this.currentTable) {
            this.app.filterManager.renderFilterOptions(this.currentTable);
        }
    }

    applyFilters() {
        this.app.filterManager.applyFilters(
            this.app.filterManager.getActiveFilters(),
        );
    }

    showError(message) {
        console.error(message);
        alert(message);
    }

    showNotification(message) {
        console.log(message);
    }

    enableLabeling() {
        document.getElementById("labelingContainer").style.display = "block";
    }

    disableLabeling() {
        document.getElementById("labelingContainer").style.display = "none";
    }

    refreshUI() {
        this.app.filterManager.renderFilterOptions(this.currentTable);
        this.app.networkManager.updateGraphWithFilteredData();
    }
}
