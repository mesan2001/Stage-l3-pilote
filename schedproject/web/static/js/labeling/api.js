export const API = {
    async fetchDatabaseSchema() {
        return fetch("/api/database-schema").then((response) =>
            response.json(),
        );
    },

    async fetchFilteredData(filters) {
        try {
            const response = await fetch("/api/hierarchical-filter", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(filters),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error applying filters:", error);
            this.ui.showError("Failed to apply filters. Please try again.");
        }
    },

    async fetchData(tableName) {
        try {
            const response = await fetch(`/api/${tableName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            await this.cacheData(tableName, data);
            return data;
        } catch (error) {
            console.error("Error fetching paged data:", error);
            return [];
        }
    },

    async saveLabels(tableName, labeledData) {
        return fetch(`/api/save-labels/${tableName}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(labeledData),
        }).then((response) => response.json());
    },

    async fetchSchema() {
        try {
            const response = await fetch("/api/database-schema");
            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return Object.fromEntries(
                Object.entries(data).filter(
                    ([_, tableInfo]) => tableInfo.table_type === "BASE TABLE",
                ),
            );
        } catch (error) {
            console.error("Error loading schema:", error);
            throw error;
        }
    },
};
