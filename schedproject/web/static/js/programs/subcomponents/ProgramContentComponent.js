import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Program } from "../../models/Program.js";

export class ProgramContentComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            program: null,
            content: null,
        };
    }

    async setOptions(newOptions) {
        const prevProgram = this.options.program;
        Object.assign(this.options, newOptions);

        if (prevProgram !== this.options.program) {
            this.options.content = null;

            if (this.options.program) {
                await this.loadProgramContent();
                await this.render();
                await this.bindEvents();
            } else {
                await this.render();
            }
        }
    }

    async beforeRender() {
        if (this.options.program && !this.options.content) {
            await this.loadProgramContent();
        }
    }

    async render() {
        if (!this.options.program) {
            this.container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    No program selected
                </div>
            `;
            return;
        }

        if (!this.options.content) {
            this.container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    Loading program content...
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="space-y-4" id="${this.getId("content-container")}">
                ${this.renderProgramContent()}
            </div>
        `;
    }

    async bindEvents() {
        const contentContainer = document.getElementById(
            this.getId("content-container"),
        );
        if (contentContainer) {
            contentContainer.addEventListener("click", (e) => {
                this.handleContentClick(e);
            });
        }
    }

    async loadProgramContent() {
        if (!this.options.program) return;

        try {
            this.options.content = await this.options.program.getContent();
        } catch (error) {
            Toast.error("Failed to load program content", error);
            this.options.content = null;
        }
    }

    renderProgramContent() {
        if (
            !this.options.content ||
            !this.options.content.steps ||
            this.options.content.steps.length === 0
        ) {
            return `
                <div class="text-center text-gray-500 py-4">
                    No content added to this program
                </div>
            `;
        }

        let contentHtml = "";
        const { steps } = this.options.content;

        for (const step of steps) {
            contentHtml += this.renderStepContent(step);
        }

        return contentHtml;
    }

    renderStepContent(step) {
        return `
            <div class="program-step-content mb-4" data-step-id="${step.id}">
                <div class="flex items-center justify-between bg-gray-50 p-3 rounded-t-lg border cursor-pointer">
                    <h3 class="text-lg font-medium">${step.name}</h3>
                    <button class="toggle-step-content text-sm text-indigo-600 hover:text-indigo-800">
                        Hide Content
                    </button>
                </div>
                <div class="step-content-container border-l border-r border-b rounded-b-lg">
                    ${this.renderCoursesContent(step)}
                </div>
            </div>
        `;
    }

    renderCoursesContent(step) {
        if (!step.courses || step.courses.length === 0) {
            return `<div class="p-3 text-gray-500">No courses in this step</div>`;
        }

        let coursesHtml = "";

        for (const course of step.courses) {
            coursesHtml += this.renderCourseContent(step, course);
        }

        return coursesHtml;
    }

    renderCourseContent(step, course) {
        console.log(course);
        return `
            <div class="program-course-content ml-4 border-l-2 border-gray-200" data-course-id="${course.id}">
                <div class="p-2 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                        <h4 class="text-md font-medium">${course.elementname}</h4>
                        <button class="toggle-course-content text-sm text-indigo-600 hover:text-indigo-800">
                            Hide Content
                        </button>
                    </div>
                    <div class="course-content-container ml-4">
                        ${this.renderModalitiesContent(step, course)}
                    </div>
                </div>
            </div>
        `;
    }

    renderModalitiesContent(step, course) {
        if (!course.modalities || course.modalities.length === 0) {
            return `<div class="p-2 text-gray-500">No modalities for this course</div>`;
        }

        return course.modalities
            .map((modality) =>
                this.renderModalityContent(step, course, modality),
            )
            .join("");
    }

    renderModalityContent(step, course, modality) {
        return `
            <div class="program-modality-content flex items-center justify-between p-2"
                 data-step-id="${step.id}"
                 data-course-id="${course.id}"
                 data-modality-id="${modality.id}">
                <span class="text-sm text-gray-600">${modality.modality}</span>
                <button class="remove-modality text-sm text-red-600 hover:text-red-800">
                    Remove
                </button>
            </div>
        `;
    }

    handleContentClick(event) {
        const target = event.target;

        if (target.classList.contains("toggle-step-content")) {
            const stepContent = target.closest(".program-step-content");
            const contentContainer = stepContent.querySelector(
                ".step-content-container",
            );

            const isHidden = contentContainer.classList.toggle("hidden");
            target.textContent = isHidden ? "Show Content" : "Hide Content";
            return;
        }

        if (target.classList.contains("toggle-course-content")) {
            const courseContent = target.closest(".program-course-content");
            const contentContainer = courseContent.querySelector(
                ".course-content-container",
            );

            const isHidden = contentContainer.classList.toggle("hidden");
            target.textContent = isHidden ? "Show Content" : "Hide Content";
            return;
        }

        if (target.classList.contains("remove-modality")) {
            const modalityContent = target.closest(".program-modality-content");
            const { stepId, courseId, modalityId } = modalityContent.dataset;

            this.removeModality(modalityId)
                .then(() => {
                    this.notifyChange("modality:removed", {
                        id: modalityId,
                        courseId,
                        stepId,
                        type: modalityContent.querySelector("span").textContent,
                    });

                    // Remove the modality element from the DOM
                    modalityContent.remove();
                })
                .catch((error) => {
                    Toast.error("Failed to remove modality", error);
                });
            return;
        }
    }

    async removeModality(modalityId) {
        if (!this.options.program) {
            throw new Error("No program selected");
        }

        try {
            return await this.options.program.removeModality(modalityId);
        } catch (error) {
            console.error("Error removing modality:", error);
            throw error;
        }
    }
}
