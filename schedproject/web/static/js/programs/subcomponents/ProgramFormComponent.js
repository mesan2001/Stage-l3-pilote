import { BaseComponent } from "../../components/BaseComponent.js";
import { Calendar } from "../../models/Calendar.js";
import { Toast } from "../../components/Toast.js";

export class ProgramFormComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            calendars: [],
        };
    }

    async beforeRender() {
        if (this.options.calendars.length === 0) {
            try {
                this.options.calendars = await Calendar.getAll();
            } catch (error) {
                Toast.error("Failed to load calendars", error);
                this.options.calendars = [];
            }
        }
        this.formids = {};
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Program Name</label>
                    <div class="relative">
                        <input type="text" id="${this.getId("program-name")}" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter program name">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Number of Students</label>
                    <input type="number" id="${this.getId("student-count")}" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter number of students">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Calendar (Optional)</label>
                    <select id="${this.getId("calendar-select")}"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="create">Create new calendar automatically</option>
                        ${this.options.calendars
                            .map(
                                (calendar) =>
                                    `<option value="${calendar.id}">${calendar.name}</option>`,
                            )
                            .join("")}
                    </select>
                </div>
            </div>
        `;
    }

    getFormData() {
        const ret = {
            name: document.getElementById(this.getId("program-name")).value,
            studentCount:
                parseInt(
                    document.getElementById(this.getId("student-count")).value,
                ) || 0,
            calendarId:
                document.getElementById(this.getId("calendar-select")).value ||
                null,
        };
        return ret;
    }

    isValid() {
        const data = this.getFormData();
        return !!data.name && data.studentCount > 0;
    }

    getId(suffix) {
        if (!this.formids[suffix]) {
            this.formids[suffix] =
                `pf-${suffix}-${BaseComponent.generateUniqueId()}`;
        }
        return this.formids[suffix];
    }
}
