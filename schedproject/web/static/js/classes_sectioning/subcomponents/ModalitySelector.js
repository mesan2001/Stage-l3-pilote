import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";

export class ModalitySelector extends BaseComponent {
    getDefaultOptions() {
        return {
            program: null,
            selectedModalities: [],
            search: "",
        };
    }

    async beforeRender() {
        this.courses = [];
        this.modalities = [];
        this.selectedModalityIds = new Set(
            this.options.selectedModalities.map((m) => m.id),
        );

        await this.loadCourses();
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="flex space-x-2">
                    <div class="flex-1">
                        <input type="text"
                            id="${this.getId("search-input")}"
                            placeholder="Search courses and modalities..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <button id="${this.getId("clear-btn")}"
                        class="px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Clear
                    </button>
                </div>

                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">
                        ${this.selectedModalityIds.size} modalities selected
                    </span>
                    <button id="${this.getId("clear-selection-btn")}"
                        class="text-xs text-gray-600 hover:text-gray-900">
                        Clear Selection
                    </button>
                </div>

                <div id="${this.getId("available-modalities")}" class="overflow-y-auto max-h-[400px] border rounded-md">
                    <div class="border-b bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                        Available Modalities
                    </div>
                    <div class="divide-y">
                        ${this.renderCourseModalities()}
                    </div>
                </div>

                <div id="${this.getId("selected-modalities")}" class="border rounded-md">
                    <div class="border-b bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                        Selected Modalities
                    </div>
                    <div class="divide-y p-2">
                        ${this.renderSelectedModalities()}
                    </div>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        const searchInput = document.getElementById(this.getId("search-input"));
        if (searchInput) {
            searchInput.value = this.options.search || "";
            searchInput.addEventListener("input", (e) => {
                this.options.search = e.target.value;
                this.updateAvailableModalities();
            });
        }

        const clearBtn = document.getElementById(this.getId("clear-btn"));
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                this.options.search = "";
                if (searchInput) searchInput.value = "";
                this.updateAvailableModalities();
            });
        }

        const clearSelectionBtn = document.getElementById(
            this.getId("clear-selection-btn"),
        );
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener("click", () => {
                this.selectedModalityIds.clear();
                this.updateSelectedModalities();
                this.updateAvailableModalities();
            });
        }

        const availableModalities = document.getElementById(
            this.getId("available-modalities"),
        );
        if (availableModalities) {
            availableModalities.addEventListener("click", (e) => {
                const checkbox = e.target.closest('input[type="checkbox"]');
                if (checkbox) {
                    const modalityId = checkbox.value;

                    if (checkbox.checked) {
                        this.selectedModalityIds.add(modalityId);
                    } else {
                        this.selectedModalityIds.delete(modalityId);
                    }

                    this.updateSelectedModalities();
                }
            });
        }

        const selectedModalities = document.getElementById(
            this.getId("selected-modalities"),
        );
        if (selectedModalities) {
            selectedModalities.addEventListener("click", (e) => {
                if (e.target.classList.contains("remove-modality-btn")) {
                    const modalityId = e.target.dataset.modalityId;
                    this.selectedModalityIds.delete(modalityId);
                    this.updateSelectedModalities();
                    this.updateAvailableModalities();
                }
            });
        }
    }

    async loadCourses() {
        if (!this.options.program) {
            Toast.warning("No program selected");
            return;
        }

        try {
            const programContent = await this.options.program.getContent();

            this.courses = [];

            programContent.steps.forEach((step) => {
                step.courses.forEach((course) => {
                    this.courses.push({
                        ...course,
                        stepName: step.name,
                    });

                    course.modalities.forEach((modality) => {
                        this.modalities.push({
                            ...modality,
                            courseName: course.elementname,
                            stepName: step.name,
                        });
                    });
                });
            });
        } catch (error) {
            Toast.error("Failed to load program courses", error);
            this.courses = [];
            this.modalities = [];
        }
    }

    renderCourseModalities() {
        if (this.courses.length === 0) {
            return `
                <div class="p-4 text-sm text-gray-500">
                    No courses available for this program
                </div>
            `;
        }

        const searchTerm = (this.options.search || "").toLowerCase();

        let html = "";
        const includedCourses = new Set();

        this.courses.forEach((course) => {
            const courseMatches =
                !searchTerm ||
                course.elementname.toLowerCase().includes(searchTerm);

            const courseModalities = this.modalities.filter(
                (m) => m.course_id === course.id,
            );

            const matchingModalities = courseModalities.filter(
                (m) =>
                    !searchTerm ||
                    m.modality.toLowerCase().includes(searchTerm),
            );

            if (!courseMatches && matchingModalities.length === 0) {
                return;
            }

            includedCourses.add(course.id);

            html += `
                <div class="p-3 course-container">
                    <div class="font-medium text-sm mb-2">${course.elementname}</div>
                    <div class="pl-4 space-y-2">
                        ${courseModalities
                            .map(
                                (modality) => `
                            <div class="flex items-center space-x-2 modality-item">
                                <input type="checkbox"
                                    id="modality-${modality.id}"
                                    value="${modality.id}"
                                    ${this.selectedModalityIds.has(modality.id.toString()) ? "checked" : ""}>
                                <label for="modality-${modality.id}" class="text-sm">
                                    ${modality.modality}
                                    <span class="text-xs text-gray-500">(${modality.hours || 0} hours)</span>
                                </label>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>
                </div>
            `;
        });

        if (includedCourses.size === 0) {
            return `
                <div class="p-4 text-sm text-gray-500">
                    No modalities match your search
                </div>
            `;
        }

        return html;
    }

    renderSelectedModalities() {
        if (this.selectedModalityIds.size === 0) {
            return `
                <div class="p-4 text-sm text-gray-500">
                    No modalities selected
                </div>
            `;
        }

        return Array.from(this.selectedModalityIds)
            .map((id) => {
                const modality = this.modalities.find(
                    (m) => m.id.toString() === id.toString(),
                );
                if (!modality) return "";

                return `
                    <div class="py-2 flex justify-between items-center">
                        <div>
                            <div class="text-sm font-medium">${modality.modality}</div>
                            <div class="text-xs text-gray-500">${modality.courseName}</div>
                        </div>
                        <button class="text-xs text-red-600 hover:text-red-900 remove-modality-btn"
                            data-modality-id="${modality.id}">
                            Remove
                        </button>
                    </div>
                `;
            })
            .join("");
    }

    updateAvailableModalities() {
        const container = document.getElementById(
            this.getId("available-modalities"),
        );
        if (container) {
            const contentDiv = container.querySelector(".divide-y");
            if (contentDiv) {
                contentDiv.innerHTML = this.renderCourseModalities();
            }
        }
    }

    updateSelectedModalities() {
        const container = document.getElementById(
            this.getId("selected-modalities"),
        );
        if (container) {
            const contentDiv = container.querySelector(".divide-y");
            if (contentDiv) {
                contentDiv.innerHTML = this.renderSelectedModalities();
            }
        }

        const countElement = this.container.querySelector(
            ".text-sm.font-medium.text-gray-700",
        );
        if (countElement) {
            countElement.textContent = `${this.selectedModalityIds.size} modalities selected`;
        }
    }

    getSelectedModalities() {
        return Array.from(this.selectedModalityIds)
            .map((id) =>
                this.modalities.find((m) => m.id.toString() === id.toString()),
            )
            .filter(Boolean);
    }
}
