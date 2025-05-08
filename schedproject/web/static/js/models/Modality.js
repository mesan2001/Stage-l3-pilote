import { AbstractModel } from "./AbstractModel.js";

export class Modality extends AbstractModel {
    static tableName = "modalities";

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
}
