import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Program } from "../../models/Program.js";

export class ProgramSelectorComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            programs: [],
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
            <div>
                <h2 class="text-xl font-semibold mb-4">Select Program</h2>

                <div class="space-y-4">
                    <div class="mb-4">
                        <label for="${this.getId("program-select")}" class="block text-sm font-medium text-gray-700">
                            Program
                        </label>
                        <div class="mt-1 flex">
                            <select id="${this.getId("program-select")}"
                                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                <option value="">Select a program...</option>
                                ${await Promise.all(
                                    this.options.programs.map(
                                        async (program) =>
                                            `<option value="${program.id}">${program.name} (${await program.getStudents().length} students)</option>`,
                                    ),
                                ).then((options) => options.join(""))}
                            </select>
                            <button id="${this.getId("refresh-btn")}"
                                class="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div id="${this.getId("program-info")}" class="border rounded-md p-4 hidden">
                    </div>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        const programSelect = document.getElementById(
            this.getId("program-select"),
        );
        const refreshButton = document.getElementById(
            this.getId("refresh-btn"),
        );

        if (programSelect) {
            programSelect.addEventListener("change", async (e) => {
                const programId = e.target.value;
                if (programId) {
                    await this.selectProgram(programId);
                } else {
                    this.clearProgramSelection();
                }
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", async () => {
                await this.refreshPrograms();
            });
        }
    }

    async refreshPrograms() {
        try {
            const programSelect = document.getElementById(
                this.getId("program-select"),
            );
            const currentSelection = programSelect ? programSelect.value : null;

            if (programSelect) {
                programSelect.disabled = true;
            }

            this.options.programs = await Program.getAll();

            await this.render();
            await this.bindEvents();

            if (currentSelection && programSelect) {
                programSelect.value = currentSelection;

                if (currentSelection) {
                    await this.selectProgram(currentSelection, false);
                }
            }

            Toast.success("Programs refreshed");
        } catch (error) {
            Toast.error("Failed to refresh programs", error);
        }
    }

    async selectProgram(programId, notify = true) {
        try {
            const program = this.options.programs.find(
                (p) => p.id == programId,
            );
            if (!program) {
                throw new Error(`Program with ID ${programId} not found`);
            }

            await this.renderProgramInfo(program);

            if (notify) {
                this.notifyChange("program:selected", {
                    id: program.id,
                    name: program.name,
                });
            }
        } catch (error) {
            Toast.error("Failed to select program", error);
        }
    }

    clearProgramSelection() {
        const programInfo = document.getElementById(this.getId("program-info"));
        if (programInfo) {
            programInfo.classList.add("hidden");
            programInfo.innerHTML = "";
        }
    }

    async renderProgramInfo(program) {
        const programInfo = document.getElementById(this.getId("program-info"));
        if (!programInfo) return;

        try {
            const programContent = await program.getContent();

            const totalCourses = programContent.steps.reduce(
                (total, step) => total + step.courses.length,
                0,
            );

            const totalModalities = programContent.steps.reduce(
                (total, step) =>
                    total +
                    step.courses.reduce(
                        (subtotal, course) =>
                            subtotal + course.modalities.length,
                        0,
                    ),
                0,
            );

            programInfo.classList.remove("hidden");
            programInfo.innerHTML = `
                <div>
                    <h3 class="text-lg font-medium">${program.name}</h3>
                    <div class="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="bg-gray-50 p-3 rounded">
                            <span class="block text-xs text-gray-500">Students</span>
                            <span class="block text-lg font-semibold">${(await program.getStudents().length) || 0}</span>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <span class="block text-xs text-gray-500">Courses</span>
                            <span class="block text-lg font-semibold">${totalCourses}</span>
                        </div>
                        <div class="bg-gray-50 p-3 rounded">
                            <span class="block text-xs text-gray-500">Modalities</span>
                            <span class="block text-lg font-semibold">${totalModalities}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            programInfo.classList.remove("hidden");
            programInfo.innerHTML = `
                <div class="bg-red-50 p-3 rounded text-red-700">
                    <p>Failed to load program details.</p>
                </div>
            `;
            console.error("Error rendering program info:", error);
        }
    }
}
