import { BaseComponent } from "../../components/BaseComponent.js";
import { Lecturer } from "../../models/Lecturer.js";
import { Toast } from "../../components/Toast.js";

export class LecturerSelector extends BaseComponent {
    getDefaultOptions() {
        return {
            lecturers: [],
        };
    }

    async beforeRender() {
        if (this.options.lecturers.length === 0) {
            try {
                this.options.lecturers = await Lecturer.getAll();
            } catch (error) {
                Toast.error("Failed to load lecturers", error);
                this.options.lecturers = [];
            }
        }
    }

    async render() {
        this.container.innerHTML = `
            <div>
                <label for="${this.getId("lecturer-select")}" class="block text-sm font-medium text-gray-700">Select Lecturer</label>
                <select id="${this.getId("lecturer-select")}"
                        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="">Choose a lecturer...</option>
                    ${this.options.lecturers
                        .map(
                            (lecturer) => `
                        <option value="${lecturer.id}">${lecturer.name}</option>
                    `,
                        )
                        .join("")}
                </select>
            </div>
        `;
    }

    async bindEvents() {
        const lecturerSelect = document.getElementById(
            this.getId("lecturer-select"),
        );

        lecturerSelect.addEventListener("change", () => {
            console.log(lecturerSelect);
            const lecturerId = lecturerSelect.value;

            if (lecturerId) {
                const selectedLecturer = this.options.lecturers.find(
                    (l) => String(l.id) === String(lecturerId),
                );
                console.log(selectedLecturer);
                this.notifyChange("lecturer:selected", selectedLecturer);
            }
        });
    }
}
