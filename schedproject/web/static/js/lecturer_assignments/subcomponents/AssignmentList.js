import { BaseComponent } from "../../components/BaseComponent.js";
import { LecturerAssignment } from "../../models/LecturerAssignment.js";
import { Course } from "../../models/Course.js";
import { Modality } from "../../models/Modality.js";
import { Toast } from "../../components/Toast.js";

export class AssignmentList extends BaseComponent {
    getDefaultOptions() {
        return {
            disabled: true,
            assignments: [],
            enrichedAssignments: [],
        };
    }

    async render() {
        this.container.innerHTML = `
            <div class="${this.options.disabled ? "opacity-50 pointer-events-none" : ""}">
                <div id="${this.getId("assignments-container")}" class="space-y-4">
                    ${await this.renderAssignments()}
                </div>
            </div>
        `;
    }

    async renderAssignments() {
        if (
            !this.options.enrichedAssignments ||
            this.options.enrichedAssignments.length === 0
        ) {
            return `
                <div class="text-center text-gray-500 py-4">
                    No assignments found
                </div>
            `;
        }

        return this.options.enrichedAssignments
            .map(
                (assignment) => `
            <div class="assignment-item p-4 border rounded mb-2" data-id="${assignment.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold">${assignment.stepName}</h3>
                        <h4 class="font-bold">${assignment.courseName}</h4>
                        <p>${assignment.modalityName} - ${assignment.nb_groups} groups</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                data-id="${assignment.id}">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `,
            )
            .join("");
    }

    async bindEvents() {
        const assignmentsContainer = document.getElementById(
            this.getId("assignments-container"),
        );

        assignmentsContainer.addEventListener("click", async (e) => {
            if (e.target.classList.contains("delete-btn")) {
                const assignmentId = e.target.dataset.id;
                await this.handleDeleteAssignment(assignmentId);
            }
        });
    }

    async loadAssignments(lecturerId) {
        try {
            const assignments =
                await LecturerAssignment.getByLecturerId(lecturerId);
            this.options.assignments = assignments;

            this.options.enrichedAssignments = await Promise.all(
                assignments.map(async (assignment) => {
                    try {
                        const course = await Course.getById(
                            assignment.course_id,
                        );
                        const modality = await Modality.getById(
                            assignment.modality_id,
                        );

                        return {
                            id: assignment.id,
                            lecturerId: assignment.lecturer_id,
                            courseId: assignment.course_id,
                            modalityId: assignment.modality_id,
                            nb_groups: assignment.nb_groups,
                            computed_hours: assignment.computed_hours,
                            stepName: course ? course.name : "Unknown Step",
                            courseName: course
                                ? course.elementname
                                : "Unknown COurse",
                            modalityName: modality
                                ? modality.modality
                                : "Unknown Modality",
                        };
                    } catch (error) {
                        console.error(
                            "Error enriching assignment data:",
                            error,
                        );
                        return {
                            id: assignment.id,
                            lecturerId: assignment.lecturer_id,
                            courseId: assignment.course_id,
                            modalityId: assignment.modality_id,
                            nb_groups: assignment.nb_groups,
                            computed_hours: assignment.computed_hours,
                            courseName: `Course #${assignment.course_id}`,
                            modalityName: `Modality #${assignment.modality_id}`,
                        };
                    }
                }),
            );

            await this.render();
            await this.bindEvents();
            return this.options.enrichedAssignments;
        } catch (error) {
            Toast.error("Failed to load assignments", error);
            throw error;
        }
    }

    async handleDeleteAssignment(assignmentId) {
        if (confirm("Are you sure you want to delete this assignment?")) {
            try {
                const assignment =
                    await LecturerAssignment.getById(assignmentId);
                await assignment.delete();

                const assignmentElement = this.container.querySelector(
                    `.assignment-item[data-id="${assignmentId}"]`,
                );
                if (assignmentElement) {
                    assignmentElement.remove();
                }

                this.options.assignments = this.options.assignments.filter(
                    (a) => a.id !== assignmentId,
                );
                this.options.enrichedAssignments =
                    this.options.enrichedAssignments.filter(
                        (a) => a.id !== assignmentId,
                    );

                Toast.success("Assignment deleted successfully");
                this.notifyChange("assignment:deleted");
            } catch (error) {
                Toast.error("Failed to delete assignment", error);
            }
        }
    }

    async setOptions(newOptions) {
        const prevDisabled = this.options.disabled;

        Object.assign(this.options, newOptions);

        if (prevDisabled !== this.options.disabled) {
            await this.render();
            await this.bindEvents();
        }
    }
}
