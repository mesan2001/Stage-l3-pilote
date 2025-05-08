import { BaseComponent } from "../../components/BaseComponent.js";
import { ModalComponent } from "../../components/ModalComponent.js";
import { Period } from "../../models/Period.js";

export class StepComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            step: null,
            index: 0,
            expanded: false,
        };
    }

    async render() {
        const step = this.options.step;
        if (!step) {
            this.container.innerHTML =
                '<div class="text-red-500">Invalid step data</div>';
            return;
        }

        const stepName =
            Period.getById(step.period_id) || `Step ${this.options.index + 1}`;
        const courseCount = step.courses ? step.courses.length : 0;

        this.container.innerHTML = `
            <div class="step-component border rounded-lg overflow-hidden">
                <div id="${this.getId("header")}" class="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50">
                    <div class="flex items-center">
                        <svg id="${this.getId("expand-icon")}" class="h-5 w-5 mr-2 transform ${this.options.expanded ? "rotate-90" : ""}"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <div>
                            <h5 class="font-medium">${stepName}</h5>
                            <p class="text-sm text-gray-500">
                                ${step.periodcode ? `Code: ${step.periodcode}` : ""}
                                ${courseCount > 0 ? ` • ${courseCount} course${courseCount !== 1 ? "s" : ""}` : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div id="${this.getId("content")}" class="p-4 border-t ${this.options.expanded ? "" : "hidden"}">
                    ${this.renderCourses()}
                </div>
            </div>
        `;
    }

    renderCourses() {
        const { step } = this.options;

        if (!step.courses || step.courses.length === 0) {
            return '<p class="text-gray-500">No courses in this step.</p>';
        }

        return `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Course Name
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Code
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CNU
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Modalities
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${step.courses.map((course) => this.renderCourseRow(course)).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderCourseRow(course) {
        const modalities = course.modalities || [];

        return `
            <tr class="course-row hover:bg-gray-50 cursor-pointer" data-course-id="${course.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${course.coursename || "Unnamed Course"}</div>
                    <div class="text-sm text-gray-500">${course.elpname || ""}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${course.coursenumber || "N/A"}</div>
                    <div class="text-sm text-gray-500">${course.elpccode || ""}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${course.cnuname || "N/A"}</div>
                    <div class="text-sm text-gray-500">${course.cnucode || ""}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${
                        modalities.length > 0
                            ? `<div class="text-sm text-gray-500">
                            ${modalities
                                .map(
                                    (m) => `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                    ${m.modality} (${m.hours}h × ${m.groups || 1})
                                </span>
                            `,
                                )
                                .join("")}
                        </div>`
                            : '<div class="text-sm text-gray-500">No modalities</div>'
                    }
                </td>
            </tr>
        `;
    }

    async bindEvents() {
        const header = this.container.querySelector(`#${this.getId("header")}`);
        if (header) {
            header.addEventListener("click", () => {
                this.toggleExpand();
            });
        }

        // Course detail modal
        const courseRows = this.container.querySelectorAll(".course-row");
        courseRows.forEach((row) => {
            row.addEventListener("click", () => {
                const courseId = row.dataset.courseId;
                this.showCourseDetails(courseId);
            });
        });
    }

    toggleExpand() {
        this.options.expanded = !this.options.expanded;

        const content = this.container.querySelector(
            `#${this.getId("content")}`,
        );
        const expandIcon = this.container.querySelector(
            `#${this.getId("expand-icon")}`,
        );

        if (content) {
            if (this.options.expanded) {
                content.classList.remove("hidden");
                expandIcon.classList.add("rotate-90");
            } else {
                content.classList.add("hidden");
                expandIcon.classList.remove("rotate-90");
            }
        }
    }

    async showCourseDetails(courseId) {
        const step = this.options.step;
        const course = step.courses.find((c) => c.id == courseId);

        if (!course) {
            Toast.error("Course not found");
            return;
        }

        // Create modal content
        const modalContent = `
            <div class="space-y-4">
                <div>
                    <h4 class="text-lg font-medium">${course.coursename || "Unnamed Course"}</h4>
                    <p class="text-gray-500">${course.elpname || ""}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h5 class="text-sm font-medium text-gray-700">Course Number</h5>
                        <p>${course.coursenumber || "N/A"}</p>
                    </div>
                    <div>
                        <h5 class="text-sm font-medium text-gray-700">ELPC Code</h5>
                        <p>${course.elpccode || "N/A"}</p>
                    </div>
                    <div>
                        <h5 class="text-sm font-medium text-gray-700">CNU Name</h5>
                        <p>${course.cnuname || "N/A"}</p>
                    </div>
                    <div>
                        <h5 class="text-sm font-medium text-gray-700">CNU Code</h5>
                        <p>${course.cnucode || "N/A"}</p>
                    </div>
                </div>

                <div>
                    <h5 class="text-sm font-medium text-gray-700 mb-2">Modalities</h5>
                    ${
                        course.modalities && course.modalities.length > 0
                            ? `<ul class="space-y-2">
                            ${course.modalities
                                .map(
                                    (m) => `
                                <li class="flex justify-between p-2 bg-gray-50 rounded">
                                    <span>${m.modality}</span>
                                    <span>${m.hours} hours × ${m.groups || 1} group(s)</span>
                                </li>
                            `,
                                )
                                .join("")}
                        </ul>`
                            : '<p class="text-gray-500">No modalities defined</p>'
                    }
                </div>
            </div>
        `;

        // Show modal with course details
        const modal = new ModalComponent();
        modal.setOptions({
            title: "Course Details",
            content: modalContent,
            buttons: [
                {
                    text: "Close",
                    handler: (_, modal) => modal.close(),
                },
            ],
        });

        await modal.init();
        modal.open();
    }
}
