import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Step } from "../../models/Step.js";
import { Course } from "../../models/Course.js";
import { Modality } from "../../models/Modality.js";

export class StepListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            disabled: true,
            steps: [],
        };
    }

    async beforeRender() {
        this.filteredSteps = [...this.options.steps];
        this.expandedSteps = new Set();
        this.expandedCourses = new Set();
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="mb-4">
                    <input
                        type="text"
                        id="${this.getId("step-search")}"
                        placeholder="Search steps..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        ${this.options.disabled ? "disabled" : ""}
                    >
                </div>
                <div id="${this.getId("steps-list")}" class="space-y-4 ${this.options.disabled ? "opacity-50 pointer-events-none" : ""}">
                    ${this.renderStepsList()}
                </div>
            </div>
        `;
    }

    async bindEvents() {
        // Search input event
        const searchInput = document.getElementById(this.getId("step-search"));
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filterSteps(e.target.value);
            });
        }

        // Step list click delegation
        const stepsList = document.getElementById(this.getId("steps-list"));
        if (stepsList) {
            stepsList.addEventListener("click", (e) => {
                this.handleStepListClick(e);
            });
        }
    }

    async loadSteps() {
        try {
            this.options.steps = await Step.getAll();
            this.filteredSteps = [...this.options.steps];
            await this.render();
            await this.bindEvents();
        } catch (error) {
            Toast.error("Failed to load steps", error);
        }
    }

    filterSteps(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        this.filteredSteps = this.options.steps.filter((step) =>
            step.name.toLowerCase().includes(searchTerm),
        );

        const stepsList = document.getElementById(this.getId("steps-list"));
        stepsList.innerHTML = this.renderStepsList();
    }

    renderStepsList() {
        if (this.filteredSteps.length === 0) {
            return `
                <div class="text-center text-gray-500 py-4">
                    No steps found matching your search
                </div>
            `;
        }

        return this.filteredSteps
            .map((step) => this.renderStepItem(step))
            .join("");
    }

    renderStepItem(step) {
        const isExpanded = this.expandedSteps.has(step.id);

        return `
            <div class="step-item border rounded-md p-4" data-step-id="${step.id}">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium">${step.name}</h3>
                    <div class="space-x-2">
                        <button class="add-all-modalities text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                            Add All
                        </button>
                        <button class="toggle-step text-sm text-indigo-600 hover:text-indigo-800">
                            ${isExpanded ? "Hide Courses" : "Show Courses"}
                        </button>
                    </div>
                </div>
                <div class="courses-container ${isExpanded ? "" : "hidden"} mt-4 space-y-3" id="${this.getId(`courses-${step.id}`)}">
                    ${isExpanded ? '<div class="p-2 text-gray-500">Loading courses...</div>' : ""}
                </div>
            </div>
        `;
    }

    async handleStepListClick(event) {
        const target = event.target;

        if (target.classList.contains("add-all-modalities")) {
            const stepItem = target.closest(".step-item");
            const stepId = stepItem.dataset.stepId;
            const step = this.options.steps.find((s) => s.id === stepId);

            this.notifyChange("step:selected", {
                id: stepId,
                name: step?.name || "Unknown step",
            });
            return;
        }

        if (target.classList.contains("toggle-step")) {
            const stepItem = target.closest(".step-item");
            const stepId = stepItem.dataset.stepId;
            const coursesContainer =
                stepItem.querySelector(".courses-container");

            if (coursesContainer.classList.contains("hidden")) {
                coursesContainer.classList.remove("hidden");
                target.textContent = "Hide Courses";
                this.expandedSteps.add(stepId);

                await this.loadAndRenderCourses(stepId, coursesContainer);
            } else {
                coursesContainer.classList.add("hidden");
                target.textContent = "Show Courses";
                this.expandedSteps.delete(stepId);
            }
            return;
        }

        if (target.classList.contains("add-all-course-modalities")) {
            const courseItem = target.closest(".course-item");
            const courseId = courseItem.dataset.courseId;
            const stepId = courseItem.closest(".step-item").dataset.stepId;

            this.notifyChange("course:selected", {
                id: courseId,
                stepId,
                name: courseItem.querySelector("h4").textContent,
            });
            return;
        }

        if (target.classList.contains("toggle-modalities")) {
            const courseItem = target.closest(".course-item");
            const courseId = courseItem.dataset.courseId;
            const modalitiesContainer = courseItem.querySelector(
                ".modalities-container",
            );

            if (modalitiesContainer.classList.contains("hidden")) {
                modalitiesContainer.classList.remove("hidden");
                target.textContent = "Hide Modalities";
                this.expandedCourses.add(courseId);

                await this.loadAndRenderModalities(
                    courseId,
                    modalitiesContainer,
                );
            } else {
                modalitiesContainer.classList.add("hidden");
                target.textContent = "Show Modalities";
                this.expandedCourses.delete(courseId);
            }
            return;
        }

        if (target.classList.contains("add-modality")) {
            const modalityItem = target.closest(".modality-item");
            const modalityId = modalityItem.dataset.modalityId;
            const courseItem = modalityItem.closest(".course-item");
            const courseId = courseItem.dataset.courseId;
            const stepId = courseItem.closest(".step-item").dataset.stepId;

            this.notifyChange("modality:selected", {
                id: modalityId,
                courseId,
                stepId,
                type: modalityItem.querySelector("span").textContent,
            });
            return;
        }
    }

    async loadAndRenderCourses(stepId, container) {
        try {
            const courses = await Course.getByStep(stepId);

            if (courses.length === 0) {
                container.innerHTML =
                    '<p class="p-2 text-gray-500">No courses available for this step</p>';
                return;
            }

            container.innerHTML = courses
                .map((course) => this.renderCourseItem(course, stepId))
                .join("");
        } catch (error) {
            container.innerHTML =
                '<p class="p-2 text-red-500">Failed to load courses</p>';
            Toast.error(`Failed to load courses for step ${stepId}`, error);
        }
    }

    renderCourseItem(course, stepId) {
        const isExpanded = this.expandedCourses.has(course.id);
        console.log(course);
        return `
            <div class="course-item ml-4 border-l-2 pl-4" data-course-id="${course.id}" data-step-id="${stepId}">
                <div class="flex items-center justify-between">
                    <h4 class="text-md">${course.elementname}</h4>
                    <div class="space-x-2">
                        <button class="add-all-course-modalities text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                            Add All
                        </button>
                        <button class="toggle-modalities text-sm text-indigo-600 hover:text-indigo-800">
                            ${isExpanded ? "Hide Modalities" : "Show Modalities"}
                        </button>
                    </div>
                </div>
                <div class="modalities-container ${isExpanded ? "" : "hidden"} mt-2 space-y-2" id="${this.getId(`modalities-${course.id}`)}">
                    ${isExpanded ? '<div class="p-2 text-gray-500">Loading modalities...</div>' : ""}
                </div>
            </div>
        `;
    }

    async loadAndRenderModalities(courseId, container) {
        try {
            const modalities = await Modality.getByCourse(courseId);

            if (modalities.length === 0) {
                container.innerHTML =
                    '<p class="p-2 text-gray-500">No modalities available for this course</p>';
                return;
            }

            container.innerHTML = modalities
                .map((modality) => this.renderModalityItem(modality))
                .join("");
        } catch (error) {
            container.innerHTML =
                '<p class="p-2 text-red-500">Failed to load modalities</p>';
            Toast.error(
                `Failed to load modalities for course ${courseId}`,
                error,
            );
        }
    }

    renderModalityItem(modality) {
        console.log(modality);
        return `
            <div class="modality-item ml-8 flex items-center justify-between" data-modality-id="${modality.id}">
                <span class="text-sm">${modality.modality} - ${modality.hours}h</span>
                <button class="add-modality text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                    Add to Program
                </button>
            </div>
        `;
    }
}
