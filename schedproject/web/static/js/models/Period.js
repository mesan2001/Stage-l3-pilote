import { AbstractModel } from "./AbstractModel.js";

export class Period extends AbstractModel {
    static tableName = "periods";

    static async getByCalendar(calendarId) {
        const response = await fetch(
            `${this.baseUrl}/${this.tableName}/calendar/${calendarId}`,
        );

        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        return data.map((item) => this.fromJSON(item));
    }
}
