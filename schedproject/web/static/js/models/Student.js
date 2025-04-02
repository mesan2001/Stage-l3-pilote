import { AbstractModel } from "./AbstractModel.js";

export class Student extends AbstractModel {
    static tableName = "students";

    static async generate(programId, count) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/program/${programId}/generate`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ num_students: count }),
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async getByProgram(programId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/program/${programId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async getCountByProgram(programId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/program/${programId}/count`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return (await response.json())["student_count"];
    }

    static async getWithoutGroup(programId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/program/${programId}/without-group`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
