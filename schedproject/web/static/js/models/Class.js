import { AbstractModel } from "./AbstractModel.js";

export class Class extends AbstractModel {
    static tableName = "classes";

    async addModalities(modalityIds) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/modalities`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modality_ids: modalityIds }),
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async removeModality(modalityId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/modalities/${modalityId}`,
            {
                method: "DELETE",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return true;
    }

    async getModalities() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/modalities`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async addGroups(groupIds) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/groups`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ group_ids: groupIds }),
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async removeGroup(groupId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/groups/${groupId}`,
            {
                method: "DELETE",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return true;
    }

    async getGroups() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/groups`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getDetails() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/details`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
