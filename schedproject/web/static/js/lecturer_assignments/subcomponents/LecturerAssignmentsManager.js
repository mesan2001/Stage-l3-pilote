import { BaseComponent } from "../../components/BaseComponent.js";
import { LecturerSelector } from "./LecturerSelector.js";
import { AssignmentForm } from "./AssignmentForm.js";
import { AssignmentList } from "./AssignmentList.js";
import { Toast } from "../../components/Toast.js";

export class LecturerAssignmentManager extends BaseComponent {
    getDefaultOptions() {
        return {
            autoLoad: true,
        };
    }

    async beforeRender() {
        this.selectedLecturer = null;
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <h1 class="text-2xl font-bold text-gray-800">Lecturer Assignment Management</h1>
                <div id="${this.getId("lecturer-selector")}" class="bg-white p-6 rounded-lg shadow"></div>
                <div id="${this.getId("assignment-form")}" class="bg-white p-6 rounded-lg shadow"></div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div id="${this.getId("assignment-list")}" class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-xl font-semibold mb-4">Current Assignments</h2>
                    </div>
                    <div id="${this.getId("workload-summary")}" class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-xl font-semibold mb-4">Workload Summary</h2>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        this.lecturerSelector = new LecturerSelector(
            document.getElementById(this.getId("lecturer-selector")),
        );
        await this.lecturerSelector.init();

        this.assignmentForm = new AssignmentForm(
            document.getElementById(this.getId("assignment-form")),
            { disabled: true },
        );
        await this.assignmentForm.init();

        this.assignmentList = new AssignmentList(
            document.getElementById(this.getId("assignment-list")),
            { disabled: true },
        );
        await this.assignmentList.init();
    }

    async bindEvents() {
        document.addEventListener("lecturer:selected", (e) => {
            this.handleLecturerSelected(e.detail.data);
        });

        document.addEventListener("assignment:created", () => {
            this.refreshLecturerData();
        });

        document.addEventListener("assignment:deleted", () => {
            this.refreshLecturerData();
        });
    }

    async handleLecturerSelected(lecturer) {
        this.selectedLecturer = lecturer;

        this.assignmentForm.setOptions({
            disabled: false,
            lecturerId: lecturer.id,
        });

        this.assignmentList.setOptions({
            disabled: false,
        });

        await this.refreshLecturerData();
    }

    async refreshLecturerData() {
        if (!this.selectedLecturer) return;

        try {
            Toast.info("Loading lecturer assignments...");

            const assignments = await this.assignmentList.loadAssignments(
                this.selectedLecturer.id,
            );

            Toast.success("Lecturer data loaded successfully");

            return assignments;
        } catch (error) {
            Toast.error("Failed to load lecturer data", error);
            throw error;
        }
    }
}
