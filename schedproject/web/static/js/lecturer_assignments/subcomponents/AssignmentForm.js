import { BaseComponent } from "../../components/BaseComponent.js";
import { Program } from "../../models/Program.js";
import { Course } from "../../models/Course.js";
import { Modality } from "../../models/Modality.js";
import { LecturerAssignment } from "../../models/LecturerAssignment.js";
import { Toast } from "../../components/Toast.js";

export class AssignmentForm extends BaseComponent {
    getDefaultOptions() {
        return {
            disabled: true,
            lecturerId: null,
            programs: [],
            courses: [],
            modalities: [],
        };
    }

    async beforeRender() {
        if (this.options.programs.length === 0) {
            try {
                this.options.programs = await Program.getAll();
            } catch (error) {
                Toast.error("Failed to load programs", error);
                this.options.programs = [];
            }
        }
    }

    async render() {
        this.container.innerHTML = `
            <div class="${this.options.disabled ? "opacity-50 pointer-events-none" : ""}">
                <h2 class="text-xl font-semibold mb-4">Add New Assignment</h2>
                <form id="${this.getId("assignment-form")}" class="space-y-4">
                    <div>
                        <label for="${this.getId("program-select")}" class="block text-sm font-medium text-gray-700">Program</label>
                        <select id="${this.getId("program-select")}"
                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Choose a program...</option>
                            ${this.options.programs
                                .map(
                                    (program) => `
                                <option value="${program.id}">${program.name}</option>
                            `,
                                )
                                .join("")}
                        </select>
                    </div>

                    <div>
                        <label for="${this.getId("course-select")}" class="block text-sm font-medium text-gray-700">Course</label>
                        <select id="${this.getId("course-select")}"
                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Select a course...</option>
                            ${this.options.courses
                                .map(
                                    (course) => `
                                <option value="${course.id}">${course.elementname}</option>
                            `,
                                )
                                .join("")}
                        </select>
                    </div>

                    <div>
                        <label for="${this.getId("modality-select")}" class="block text-sm font-medium text-gray-700">Modality</label>
                        <select id="${this.getId("modality-select")}"
                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value="">Select a modality...</option>
                            ${this.options.modalities
                                .map(
                                    (modality) => `
                                <option value="${modality.id || modality.modality_id}">${modality.name || modality.modality}</option>
                            `,
                                )
                                .join("")}
                        </select>
                    </div>

                    <div>
                        <label for="${this.getId("groups-input")}" class="block text-sm font-medium text-gray-700">Number of Groups</label>
                        <input type="number" id="${this.getId("groups-input")}" min="1"
                               class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                               placeholder="Enter number of groups">
                    </div>

                    <div>
                        <button type="submit" id="${this.getId("submit-btn")}"
                                class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Add Assignment
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async bindEvents() {
        const programSelect = document.getElementById(
            this.getId("program-select"),
        );
        const courseSelect = document.getElementById(
            this.getId("course-select"),
        );
        const form = document.getElementById(this.getId("assignment-form"));

        programSelect.addEventListener("change", async () => {
            const programId = programSelect.value;
            if (programId) {
                await this.loadCoursesForProgram(programId);
            } else {
                this.updateCourseOptions([]);
            }
        });

        courseSelect.addEventListener("change", async () => {
            const courseId = courseSelect.value;
            if (courseId) {
                await this.loadModalitiesForCourse(courseId);
            } else {
                this.updateModalityOptions([]);
            }
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    async loadCoursesForProgram(programId) {
        try {
            const program = await Program.getById(programId);
            const courses = await program.getCourses();
            this.options.courses = courses;
            this.updateCourseOptions(courses);
        } catch (error) {
            Toast.error("Failed to load courses", error);
        }
    }

    updateCourseOptions(courses) {
        const courseSelect = document.getElementById(
            this.getId("course-select"),
        );
        courseSelect.innerHTML = `
            <option value="">Select a course...</option>
            ${courses
                .map(
                    (course) => `
                <option value="${course.id}">${course.elementname}</option>
            `,
                )
                .join("")}
        `;
        // Clear modalities when courses change
        this.updateModalityOptions([]);
    }

    async loadModalitiesForCourse(courseId) {
        try {
            const modalities = await Modality.getByCourse(courseId);
            this.options.modalities = modalities;
            this.updateModalityOptions(modalities);
        } catch (error) {
            Toast.error("Failed to load modalities", error);
        }
    }

    updateModalityOptions(modalities) {
        const modalitySelect = document.getElementById(
            this.getId("modality-select"),
        );
        modalitySelect.innerHTML = `
            <option value="">Select a modality...</option>
            ${modalities
                .map(
                    (modality) => `
                <option value="${modality.id || modality.modality_id}">${modality.name || modality.modality}</option>
            `,
                )
                .join("")}
        `;
    }

    validateForm() {
        const courseSelect = document.getElementById(
            this.getId("course-select"),
        );
        const modalitySelect = document.getElementById(
            this.getId("modality-select"),
        );
        const groupsInput = document.getElementById(this.getId("groups-input"));

        return (
            this.options.lecturerId &&
            courseSelect.value &&
            modalitySelect.value &&
            groupsInput.value &&
            parseInt(groupsInput.value) > 0
        );
    }

    async handleSubmit() {
        if (!this.validateForm()) {
            Toast.warning("Please fill in all required fields");
            return;
        }

        const courseSelect = document.getElementById(
            this.getId("course-select"),
        );
        const modalitySelect = document.getElementById(
            this.getId("modality-select"),
        );
        const groupsInput = document.getElementById(this.getId("groups-input"));

        try {
            const assignmentData = {
                lecturer_id: this.options.lecturerId,
                course_id: courseSelect.value,
                modality_id: modalitySelect.value,
                nb_groups: parseInt(groupsInput.value),
            };

            await LecturerAssignment.create(assignmentData);

            // Reset form
            courseSelect.value = "";
            modalitySelect.value = "";
            groupsInput.value = "";
            this.updateModalityOptions([]);

            Toast.success("Assignment created successfully");
            this.notifyChange("assignment:created");
        } catch (error) {
            Toast.error("Failed to create assignment", error);
        }
    }

    async setOptions(newOptions) {
        const prevDisabled = this.options.disabled;
        const prevLecturerId = this.options.lecturerId;

        Object.assign(this.options, newOptions);

        if (
            prevDisabled !== this.options.disabled ||
            prevLecturerId !== this.options.lecturerId
        ) {
            await this.render();
            await this.bindEvents();
        }
    }
}
