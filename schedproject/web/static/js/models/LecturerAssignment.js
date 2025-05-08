import { AbstractModel } from "./AbstractModel.js";

export class LecturerAssignment extends AbstractModel {
    static tableName = "lecturer_assignments";

    static async getByLecturerId(lecturerId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/by-lecturer/${lecturerId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.map((item) => this.fromJSON(item));
    }

    static async getByCourseId(courseId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/by-course/${courseId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.map((item) => this.fromJSON(item));
    }

    static async getByModalityId(modalityId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/by-modality/${modalityId}`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.map((item) => this.fromJSON(item));
    }

    static async deleteByLecturerId(lecturerId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/delete-by-lecturer/${lecturerId}`,
            {
                method: "DELETE",
            },
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return true;
    }
}
