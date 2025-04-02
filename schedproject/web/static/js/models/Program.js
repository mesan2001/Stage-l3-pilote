import { AbstractModel } from "./AbstractModel.js";

export class Program extends AbstractModel {
    static tableName = "programs";

    async getModalities() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/modalities`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getCourses() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/courses`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async addModality(modalityId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/modalities/${modalityId}`,
            {
                method: "POST",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async addBatchModalities(modalityIds) {
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

    async addCourseModalities(courseId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/courses/${courseId}/modalities`,
            {
                method: "POST",
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

    async removeBatchModalities(modalityIds) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/modalities`,
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modality_ids: modalityIds }),
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async removeCourseModalities(courseId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/courses/${courseId}/modalities`,
            {
                method: "DELETE",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async addStepModalities(stepId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/steps/${stepId}/modalities`,
            {
                method: "POST",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async removeStepModalities(stepId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/steps/${stepId}/modalities`,
            {
                method: "DELETE",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getSummary() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/summary`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getContent() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/content`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getStudents() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/students`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
