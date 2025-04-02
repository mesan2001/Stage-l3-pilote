import { AbstractModel } from "./AbstractModel.js";

export class Group extends AbstractModel {
    static tableName = "groups";

    static async getByProgram(programId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/program/${programId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async createGroup(programId, name) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/program/${programId}/create`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async assignStudent(studentId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/students/${studentId}`,
            {
                method: "POST",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async removeStudentFromGroups(studentId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/students/${studentId}`,
            {
                method: "DELETE",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getStudents() {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/${this.id}/students`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    static async generateAndAssign(programId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/generate-and-assign/${programId}`,
            {
                method: "POST",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
