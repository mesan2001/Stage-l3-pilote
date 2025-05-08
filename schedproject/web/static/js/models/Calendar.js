import { AbstractModel } from "./AbstractModel.js";
import { Period } from "./Period.js";

export class Calendar extends AbstractModel {
    static tableName = "calendars";

    async getPeriods() {
        return Period.getByCalendar(this.id);
    }

    async getMissingPeriods() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/missing-periods`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getUsedPeriods() {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/${this.id}/used-periods`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    async getProgramCalendarInfo(programId) {
        const response = await fetch(
            `${this.constructor.baseUrl}/${this.constructor.tableName}/program/${programId}/calendar-info`,
        );
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
}
