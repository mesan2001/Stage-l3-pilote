import { AbstractModel } from "./AbstractModel.js";

export class Course extends AbstractModel {
    static tableName = "courses";

    static async getByStep(stepId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/step/${stepId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
