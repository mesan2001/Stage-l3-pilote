import { AbstractModel } from "./AbstractModel.js";

export class Labels extends AbstractModel {
    static tableName = "labels";

    static async getHierarchy() {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/hierarchy`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async getForObject(resource_type, resource_id) {
        try {
            const response = await fetch(
                `/api/labels/resource/${resource_type}/${resource_id}`,
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(
                `Error fetching labels for ${resource_type}#${resource_id}:`,
                error,
            );
            throw error;
        }
    }

    static async addCustomLabel(
        resource_type,
        resource_id,
        label_key,
        label_value,
    ) {
        try {
            const response = await fetch(`/api/labels/custom`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resource_type: resource_type,
                    resource_id: resource_id,
                    label_key: label_key,
                    label: label_value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error adding custom label:", error);
            throw error;
        }
    }

    static async removeCustomLabel(labelId) {
        try {
            const response = await fetch(`/api/labels/custom/${labelId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error removing custom label:", error);
            throw error;
        }
    }

    static async searchByLabel(label_key, label_value, resource_type = null) {
        try {
            let url = `/api/labels/search?label_key=${encodeURIComponent(label_key)}&label_value=${encodeURIComponent(label_value)}`;

            if (resource_type) {
                url += `&resource_type=${encodeURIComponent(resource_type)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error searching by label:", error);
            throw error;
        }
    }

    static async regenerateLabelsView() {
        try {
            const response = await fetch(`/api/labels/regenerate`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error regenerating labels view:", error);
            throw error;
        }
    }

    static async getLabelRows(
        resource_type = null,
        label_key = null,
        label_value = null,
    ) {
        try {
            let url = `/api/labels/rows`;
            const params = [];

            if (resource_type)
                params.push(
                    `resource_type=${encodeURIComponent(resource_type)}`,
                );
            if (label_key)
                params.push(`label_key=${encodeURIComponent(label_key)}`);
            if (label_value)
                params.push(`label_value=${encodeURIComponent(label_value)}`);

            if (params.length > 0) {
                url += `?${params.join("&")}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error getting label rows:", error);
            throw error;
        }
    }

    static async getPossibleAssociations(
        resource_type = null,
        label_key = null,
        label_value = null,
    ) {
        try {
            let url = `/api/labels/associations`;
            const params = [];

            if (resource_type)
                params.push(
                    `resource_type=${encodeURIComponent(resource_type)}`,
                );
            if (label_key)
                params.push(`label_key=${encodeURIComponent(label_key)}`);
            if (label_value)
                params.push(`label_value=${encodeURIComponent(label_value)}`);

            if (params.length > 0) {
                url += `?${params.join("&")}`;
            }
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error getting possible associations:", error);
            throw error;
        }
    }

    static async getAssociatedObjects(
        resource_type = null,
        label_key = null,
        label_value = null,
    ) {
        try {
            let url = `/api/labels/associated-objects`;
            const params = [];

            if (resource_type)
                params.push(
                    `resource_type=${encodeURIComponent(resource_type)}`,
                );
            if (label_key)
                params.push(`label_key=${encodeURIComponent(label_key)}`);
            if (label_value)
                params.push(`label_value=${encodeURIComponent(label_value)}`);

            if (params.length > 0) {
                url += `?${params.join("&")}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error getting associated objects:", error);
            throw error;
        }
    }
}
