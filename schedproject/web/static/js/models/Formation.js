import { AbstractModel } from "./AbstractModel.js";

export class Formation extends AbstractModel {
    static tableName = "formations";

    static async getContent(formationId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/${formationId}/content`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async getByStep(stepId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/step/${stepId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async getByCourse(courseId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/course/${courseId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getSteps() {
        const response = await fetch(
            `${this.baseUrl}/steps/formation/${this.id}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
