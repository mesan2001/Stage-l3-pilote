import { AbstractModel } from "./AbstractModel.js";

export class Rule extends AbstractModel {
    static tableName = "rules";

    async getCompleteData() {
        try {
            const response = await fetch(`/api/rules/${this.id}/complete`);
            if (!response.ok)
                throw new Error("Failed to fetch complete rule data");
            return await response.json();
        } catch (error) {
            console.error("Error fetching complete rule data:", error);
            throw error;
        }
    }

    static async getCompleteById(id) {
        try {
            const response = await fetch(`/api/rules/${id}/complete`);
            if (!response.ok)
                throw new Error("Failed to fetch complete rule data");
            return await response.json();
        } catch (error) {
            console.error("Error fetching complete rule data:", error);
            throw error;
        }
    }

    async getSelectors() {
        try {
            const response = await fetch(`/api/rules/${this.id}/selectors`);
            if (!response.ok) throw new Error("Failed to fetch rule selectors");
            return await response.json();
        } catch (error) {
            console.error("Error fetching rule selectors:", error);
            throw error;
        }
    }

    async addSelector(selectorId) {
        try {
            const response = await fetch(
                `/api/rules/${this.id}/selectors/${selectorId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            if (!response.ok) throw new Error("Failed to add selector to rule");
            return await response.json();
        } catch (error) {
            console.error("Error adding selector to rule:", error);
            throw error;
        }
    }

    async removeSelector(selectorId) {
        try {
            const response = await fetch(
                `/api/rules/${this.id}/selectors/${selectorId}`,
                {
                    method: "DELETE",
                },
            );
            if (!response.ok)
                throw new Error("Failed to remove selector from rule");
            return await response.json();
        } catch (error) {
            console.error("Error removing selector from rule:", error);
            throw error;
        }
    }

    async updateSelectors(selectorIds) {
        try {
            const response = await fetch(`/api/rules/${this.id}/selectors`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ selector_ids: selectorIds }),
            });
            if (!response.ok)
                throw new Error("Failed to update rule selectors");
            return await response.json();
        } catch (error) {
            console.error("Error updating rule selectors:", error);
            throw error;
        }
    }

    static async createWithSelectors(ruleData, selectorIds) {
        try {
            const response = await fetch(`/api/rules/with-selectors`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rule: ruleData,
                    selector_ids: selectorIds,
                }),
            });
            if (!response.ok)
                throw new Error("Failed to create rule with selectors");
            return await response.json();
        } catch (error) {
            console.error("Error creating rule with selectors:", error);
            throw error;
        }
    }

    static async getSelectorsForRule(ruleId) {
        try {
            const response = await fetch(`/api/rules/${ruleId}/selectors`);
            if (!response.ok) throw new Error("Failed to fetch rule selectors");
            return await response.json();
        } catch (error) {
            console.error("Error fetching rule selectors:", error);
            throw error;
        }
    }
}

export class Selector extends AbstractModel {
    static tableName = "selectors";

    async getWithFilters() {
        try {
            const response = await fetch(`/api/selectors/${this.id}/filters`);
            if (!response.ok)
                throw new Error("Failed to fetch selector with filters");
            return await response.json();
        } catch (error) {
            console.error("Error fetching selector with filters:", error);
            throw error;
        }
    }

    async addFilter(filterData) {
        try {
            const response = await fetch(`/api/selectors/${this.id}/filters`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(filterData),
            });
            if (!response.ok)
                throw new Error("Failed to add filter to selector");
            return await response.json();
        } catch (error) {
            console.error("Error adding filter to selector:", error);
            throw error;
        }
    }

    async getTextRepresentation() {
        try {
            const response = await fetch(
                `/api/selectors/${this.id}/representation`,
            );
            if (!response.ok)
                throw new Error("Failed to fetch selector text representation");
            const data = await response.json();
            return data.representation;
        } catch (error) {
            console.error(
                "Error fetching selector text representation:",
                error,
            );
            throw error;
        }
    }

    static async addFilterToSelector(selectorId, filterData) {
        try {
            const response = await fetch(
                `/api/selectors/${selectorId}/filters`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(filterData),
                },
            );
            if (!response.ok)
                throw new Error("Failed to add filter to selector");
            return await response.json();
        } catch (error) {
            console.error("Error adding filter to selector:", error);
            throw error;
        }
    }

    static async getWithFiltersById(id) {
        try {
            const response = await fetch(`/api/selectors/${id}/filters`);
            if (!response.ok)
                throw new Error("Failed to fetch selector with filters");
            return await response.json();
        } catch (error) {
            console.error("Error fetching selector with filters:", error);
            throw error;
        }
    }

    static async getTextRepresentationById(id) {
        try {
            const response = await fetch(`/api/selectors/${id}/representation`);
            if (!response.ok)
                throw new Error("Failed to fetch selector text representation");
            const data = await response.json();
            return data.representation;
        } catch (error) {
            console.error(
                "Error fetching selector text representation:",
                error,
            );
            throw error;
        }
    }
}

export class Filter extends AbstractModel {
    static tableName = "filters";

    async getTextRepresentation() {
        try {
            const response = await fetch(
                `/api/filters/${this.id}/representation`,
            );
            if (!response.ok)
                throw new Error("Failed to fetch filter text representation");
            const data = await response.json();
            return data.representation;
        } catch (error) {
            console.error("Error fetching filter text representation:", error);
            throw error;
        }
    }

    static async getTextRepresentationById(id) {
        try {
            const response = await fetch(`/api/filters/${id}/representation`);
            if (!response.ok)
                throw new Error("Failed to fetch filter text representation");
            const data = await response.json();
            return data.representation;
        } catch (error) {
            console.error("Error fetching filter text representation:", error);
            throw error;
        }
    }
}
