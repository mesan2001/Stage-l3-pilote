import { BaseComponent } from "../../components/BaseComponent.js";
import { ModalComponent } from "../../components/ModalComponent.js";
import { Toast } from "../../components/Toast.js";
import { Program } from "../../models/Program.js";
import { Student } from "../../models/Student.js";
import { Calendar } from "../../models/Calendar.js";

import { ProgramFormComponent } from "./ProgramFormComponent.js";
import { StepListComponent } from "./StepListComponent.js";
import { ProgramContentComponent } from "./ProgramContentComponent.js";
import { Group } from "../../models/Group.js";

export class ProgramManager extends BaseComponent {
    getDefaultOptions() {
        return {
            autoLoad: true,
        };
    }

    beforeRender() {
        this.currentProgram = null;
        this.programs = [];
        this.modal = null;
        this.stepListComponent = null;
        this.programContentComponent = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <h1 class="text-2xl font-bold text-gray-800">Program Management</h1>
                <div id="${this.getId("selector")}" class="bg-white p-6 rounded-lg shadow"></div>
                <div id="${this.getId("current-program")}" class="bg-white p-6 rounded-lg shadow"></div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div id="${this.getId("steps")}" class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-xl font-semibold mb-4">Available Steps</h2>
                    </div>
                    <div id="${this.getId("content")}" class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-xl font-semibold mb-4">Program Content</h2>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement("div");
        modalContainer.id = this.getId("modal-container");
        this.container.appendChild(modalContainer);
        this.modal = new ModalComponent(modalContainer);
    }

    afterRender() {
        this.stepListComponent = new StepListComponent(
            document.getElementById(this.getId("steps")),
            { disabled: true },
        );
        this.stepListComponent.init();

        this.programContentComponent = new ProgramContentComponent(
            document.getElementById(this.getId("content")),
            { program: null },
        );
        this.programContentComponent.init();

        if (this.options.autoLoad) {
            this.loadData();
        }
    }

    bindEvents() {
        document.addEventListener("step:selected", (e) => {
            console.log("Step selected event received:", e.detail.data);
            this.handleStepSelected(e.detail.data);
        });

        document.addEventListener("course:selected", (e) => {
            console.log("Course selected event received:", e.detail.data);
            this.handleCourseSelected(e.detail.data);
        });

        document.addEventListener("modality:selected", (e) => {
            console.log("Modality selected event received:", e.detail.data);
            this.handleModalitySelected(e.detail.data);
        });

        document.addEventListener("modality:removed", (e) => {
            console.log("Modality removed event received:", e.detail.data);
            this.handleModalityRemoved(e.detail.data);
        });

        document.addEventListener("program:new", () => {
            console.log("New program event received");
            this.showNewProgramForm();
        });

        document.addEventListener("program:selected", (e) => {
            console.log("Program selected event received:", e.detail.data);
            this.handleProgramSelected(e.detail.data);
        });

        document.addEventListener("program:save", () => {
            console.log("Save program event received");
            this.saveCurrentProgram();
        });

        document.addEventListener("program:clear", () => {
            console.log("Clear program event received");
            this.clearCurrentProgram();
        });
    }

    async loadData() {
        try {
            Toast.info("Loading programs and steps...");
            await Promise.all([
                this.loadPrograms(),
                this.stepListComponent.loadSteps(),
            ]);
            Toast.success("Data loaded successfully");
        } catch (error) {
            Toast.error("Failed to load data", error);
        }
    }

    async loadPrograms() {
        try {
            this.programs = await Program.getAll();
            await this.renderProgramSelector();
        } catch (error) {
            Toast.error("Failed to load programs", error);
            throw error;
        }
    }

    async renderProgramSelector() {
        const selectorContainer = document.getElementById(
            this.getId("selector"),
        );

        const programCounts = {};
        for (const program of this.programs) {
            programCounts[program.id] = await Student.getCountByProgram(
                program.id,
            );
        }

        selectorContainer.innerHTML = `
            <div class="flex space-x-4 mb-4">
                <select id="${this.getId("program-select")}" class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Select an existing program</option>
                    ${this.programs
                        .map(
                            (program) =>
                                `<option value="${program.id}">${program.name} (${programCounts[program.id]} students)</option>`,
                        )
                        .join("")}
                </select>
                <button id="${this.getId("new-program")}" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    New Program
                </button>
            </div>
        `;

        document
            .getElementById(this.getId("program-select"))
            .addEventListener("change", (e) => {
                if (e.target.value) {
                    this.loadProgram(e.target.value);
                }
            });

        document
            .getElementById(this.getId("new-program"))
            .addEventListener("click", () => {
                this.showNewProgramForm();
            });
    }

    async loadProgram(programId) {
        try {
            Toast.info("Loading program...");
            this.currentProgram = await Program.getById(programId);

            await this.updateCurrentProgramView();
            this.programContentComponent.setOptions({
                program: this.currentProgram,
            });
            this.stepListComponent.setOptions({ disabled: false });

            Toast.success("Program loaded successfully");
        } catch (error) {
            Toast.error("Failed to load program", error);
        }
    }

    async updateCurrentProgramView() {
        const container = document.getElementById(
            this.getId("current-program"),
        );

        if (!this.currentProgram) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-bold">${this.currentProgram.name}</h3>
                        <p class="text-sm text-gray-600">Students: ${await Student.getCountByProgram(this.currentProgram.id)}</p>
                    </div>
                    <div class="space-x-2">
                        <button id="${this.getId("save-program")}" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                            Save Changes
                        </button>
                        <button id="${this.getId("clear-program")}" class="text-gray-600 hover:text-gray-800">
                            Clear Selection
                        </button>
                    </div>
                </div>
            </div>
        `;

        document
            .getElementById(this.getId("save-program"))
            .addEventListener("click", () => {
                this.saveCurrentProgram();
            });

        document
            .getElementById(this.getId("clear-program"))
            .addEventListener("click", () => {
                this.clearCurrentProgram();
            });
    }

    showNewProgramForm() {
        const formContainer = document.createElement("div");
        const programForm = new ProgramFormComponent(formContainer);

        this.modal.setOptions({
            title: "Create New Program",
            content: programForm,
            buttons: [
                {
                    text: "Cancel",
                    handler: () => this.modal.close(),
                },
                {
                    text: "Create Program",
                    handler: () => this.handleProgramCreate(programForm),
                },
            ],
        });

        programForm.init().then(() => this.modal.open());
    }

    async handleProgramCreate(formComponent) {
        try {
            const formData = formComponent.getFormData();
            if (!formData.name) {
                Toast.warning("Please fill in all required fields");
                return;
            }

            Toast.info("Creating program...");
            this.modal.close();

            if (formData.calendarId == "create") {
                const calendar = await Calendar.create({
                    name: `${formData.name}'s Calendar`,
                });
                formData.calendarId = calendar.id;
            }

            this.currentProgram = new Program({
                name: formData.name,
                calendar_id: formData.calendarId || null,
            });

            const savedProgram = await this.currentProgram.save();

            this.currentProgram = savedProgram;

            await Student.generate(
                this.currentProgram.id,
                formData.studentCount,
            );

            // await Group.generateAndAssign(this.currentProgram.id);

            await this.loadPrograms();
            this.updateCurrentProgramView();
            this.programContentComponent.setOptions({
                program: this.currentProgram,
            });
            this.stepListComponent.setOptions({ disabled: false });

            Toast.success("Program created successfully");
        } catch (error) {
            Toast.error("Failed to create program", error);
        }
    }

    async handleStepSelected(stepData) {
        if (!this.currentProgram) {
            Toast.warning("Please create or select a program first");
            return;
        }

        try {
            await this.currentProgram.addStepModalities(stepData.id);
            await this.refreshProgramContent();
            Toast.success(`Added all modalities for step "${stepData.name}"`);
        } catch (error) {
            Toast.error(`Failed to add step "${stepData.name}"`, error);
        }
    }

    async handleCourseSelected(courseData) {
        if (!this.currentProgram) {
            Toast.warning("Please create or select a program first");
            return;
        }

        try {
            await this.currentProgram.addCourseModalities(courseData.id);
            await this.refreshProgramContent();
            Toast.success(
                `Added all modalities for course "${courseData.name}"`,
            );
        } catch (error) {
            Toast.error(`Failed to add course "${courseData.name}"`, error);
        }
    }

    async handleModalitySelected(modalityData) {
        if (!this.currentProgram) {
            Toast.warning("Please create or select a program first");
            return;
        }

        try {
            await this.currentProgram.addModality(modalityData.id);
            await this.refreshProgramContent();
            Toast.success(`Added modality "${modalityData.type}"`);
        } catch (error) {
            Toast.error(`Failed to add modality "${modalityData.type}"`, error);
        }
    }

    async handleModalityRemoved(modalityData) {
        try {
            await this.currentProgram.removeModality(modalityData.id);
            await this.refreshProgramContent();
            Toast.success(`Removed modality "${modalityData.type}"`);
        } catch (error) {
            Toast.error(
                `Failed to remove modality "${modalityData.type}"`,
                error,
            );
        }
    }

    async refreshProgramContent() {
        if (this.currentProgram?.id) {
            this.currentProgram = await Program.getById(this.currentProgram.id);
            this.programContentComponent.setOptions({
                program: this.currentProgram,
            });
        }
    }

    async saveCurrentProgram() {
        if (!this.currentProgram) {
            Toast.warning("No program selected");
            return;
        }

        try {
            const saveButton = document.getElementById(
                this.getId("save-program"),
            );
            saveButton.disabled = true;
            saveButton.innerHTML = `
                <span class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                </span>
            `;

            await this.currentProgram.save();

            await this.checkCalendarPeriods();

            saveButton.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
            saveButton.classList.add("bg-green-600", "hover:bg-green-700");
            saveButton.innerHTML = `
                <span class="inline-flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Saved!
                </span>
            `;

            setTimeout(() => {
                saveButton.disabled = false;
                saveButton.classList.remove(
                    "bg-green-600",
                    "hover:bg-green-700",
                );
                saveButton.classList.add(
                    "bg-indigo-600",
                    "hover:bg-indigo-700",
                );
                saveButton.innerHTML = "Save Changes";
            }, 2000);

            Toast.success("Program saved successfully");
        } catch (error) {
            const saveButton = document.getElementById(
                this.getId("save-program"),
            );
            saveButton.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
            saveButton.classList.add("bg-red-600", "hover:bg-red-700");
            saveButton.innerHTML = `
                <span class="inline-flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Error
                </span>
            `;

            setTimeout(() => {
                saveButton.disabled = false;
                saveButton.classList.remove("bg-red-600", "hover:bg-red-700");
                saveButton.classList.add(
                    "bg-indigo-600",
                    "hover:bg-indigo-700",
                );
                saveButton.innerHTML = "Save Changes";
            }, 2000);

            Toast.error("Failed to save program", error);
        }
    }

    async checkCalendarPeriods() {
        if (!this.currentProgram?.calendar_id) return;

        try {
            const calendar = await Calendar.getById(
                this.currentProgram.calendar_id,
            );
            if (!calendar) {
                throw new Error("Calendar not found");
            }

            const calendarInfo = await calendar.getProgramCalendarInfo(
                this.currentProgram.id,
            );
            const missingPeriods = calendarInfo.missing_periods || [];

            if (missingPeriods.length > 0) {
                Toast.warning(
                    `This program contains ${missingPeriods.length} course periods that are missing in the calendar. Please add them manually in the Calendar section.`,
                );

                console.log("Missing periods:", missingPeriods);
            }
        } catch (error) {
            Toast.error("Error checking calendar periods", error);
        }
    }

    clearCurrentProgram() {
        this.currentProgram = null;
        this.updateCurrentProgramView();
        this.programContentComponent.setOptions({ program: null });
        this.stepListComponent.setOptions({ disabled: true });
        Toast.info("Program selection cleared");
    }

    getId(suffix) {
        return `pm-${suffix}-${this._componentId}`;
    }
}
