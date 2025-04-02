import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Program } from "../../models/Program.js";
import { Student } from "../../models/Student.js";

export class ProgramSelector extends BaseComponent {
    getDefaultOptions() {
        return {
            programs: [],
            selectedProgramId: null,
        };
    }

    async beforeRender() {
        this.filteredPrograms = [];
    }

    async render() {
        this.container.innerHTML = `
            <div class="program-selector">
                <div class="relative">
                    <input
                        type="text"
                        id="${this.getId("program-search")}"
                        placeholder="Search for a program..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                    <div id="${this.getId("program-list")}"
                        class="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto hidden">
                        <!-- Program list items rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    async bindEvents() {
        const programSearch = document.getElementById(
            this.getId("program-search"),
        );
        const programList = document.getElementById(this.getId("program-list"));

        programSearch.addEventListener("input", () => {
            this.handleProgramSearch(programSearch.value);
        });

        programSearch.addEventListener("focus", async () => {
            if (this.options.programs.length > 0) {
                await this.renderProgramList();
                programList.classList.remove("hidden");
            }
        });

        programSearch.addEventListener("blur", () => {
            setTimeout(() => {
                programList.classList.add("hidden");
            }, 200);
        });

        programList.addEventListener("click", (e) => {
            this.handleProgramSelect(e);
        });
    }

    async loadPrograms() {
        try {
            const programs = await Program.getAll();

            this.options.programs = programs;
            this.filteredPrograms = [...this.options.programs];

            Toast.success(`${programs.length} programs loaded successfully`);
        } catch (error) {
            Toast.error("Failed to load programs", error);
            this.options.programs = [];
            this.filteredPrograms = [];
        }
    }

    async handleProgramSearch(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        this.filteredPrograms = this.options.programs.filter((program) =>
            program.name.toLowerCase().includes(searchTerm),
        );

        await this.renderProgramList();

        const programList = document.getElementById(this.getId("program-list"));
        if (this.filteredPrograms.length > 0) {
            programList.classList.remove("hidden");
        } else {
            programList.classList.add("hidden");
        }
    }

    async renderProgramList() {
        const programList = document.getElementById(this.getId("program-list"));

        if (this.filteredPrograms.length === 0) {
            programList.innerHTML = `
                <div class="p-4 text-gray-500 text-center">No programs found</div>
            `;
            return;
        }

        const programsHtml = [];
        for (const program of this.filteredPrograms) {
            const studentCount = await Student.getCountByProgram(program.id);
            programsHtml.push(`
                <div class="program-item p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                    data-program-id="${program.id}">
                    <div class="font-medium">${program.name}</div>
                    <div class="text-sm text-gray-600">Students: ${studentCount || 0}</div>
                </div>
            `);
        }

        programList.innerHTML = programsHtml.join("");
    }

    handleProgramSelect(event) {
        const programItem = event.target.closest(".program-item");
        if (!programItem) return;

        const programId = programItem.dataset.programId;

        let program = this.filteredPrograms.find((p) => p.id === programId);

        if (!program) {
            program = this.options.programs.find((p) => p.id === programId);
        }

        if (!program) {
            console.warn(
                `Program with ID ${programId} not found in available programs`,
            );
            program = {
                id: programId,
                name: programItem.querySelector(".font-medium").textContent,
            };
        }

        this.options.selectedProgramId = programId;

        const programSearch = document.getElementById(
            this.getId("program-search"),
        );
        programSearch.value = program.name;

        const programList = document.getElementById(this.getId("program-list"));
        programList.classList.add("hidden");

        this.notifyChange("program:selected", {
            id: program.id,
            name: program.name,
        });
    }
}
