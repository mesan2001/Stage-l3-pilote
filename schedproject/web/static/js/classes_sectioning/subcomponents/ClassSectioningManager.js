import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { initializeModels } from "../../models/AbstractModel.js";
import { Class } from "../../models/Class.js";
import { Program } from "../../models/Program.js";
import { Group } from "../../models/Group.js";
import { Modality } from "../../models/Modality.js";
import { Course } from "../../models/Course.js";

import { ProgramSelectorComponent } from "./ProgramSelectorComponent.js";
import { ClassListComponent } from "./ClassListComponent.js";
import { ClassEditorComponent } from "./ClassEditorComponent.js";

export class ClassSectioningManager extends BaseComponent {
    getDefaultOptions() {
        return {
            autoLoad: true,
        };
    }

    async beforeRender() {
        this.currentProgram = null;
        this.selectedClass = null;

        this.programSelector = null;
        this.classList = null;
        this.classEditor = null;
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <h1 class="text-2xl font-bold text-gray-800">Class Management</h1>

                <div id="${this.getId("program-selector")}" class="bg-white p-6 rounded-lg shadow">
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-1">
                        <div id="${this.getId("class-list")}" class="bg-white p-6 rounded-lg shadow">
                        </div>
                    </div>

                    <div class="lg:col-span-2">
                        <div id="${this.getId("class-editor")}" class="bg-white p-6 rounded-lg shadow">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        this.programSelector = new ProgramSelectorComponent(
            document.getElementById(this.getId("program-selector")),
        );

        this.classList = new ClassListComponent(
            document.getElementById(this.getId("class-list")),
            { disabled: true },
        );

        this.classEditor = new ClassEditorComponent(
            document.getElementById(this.getId("class-editor")),
            { disabled: true },
        );

        await Promise.all([
            this.programSelector.init(),
            this.classList.init(),
            this.classEditor.init(),
        ]);

        if (this.options.autoLoad) {
            await this.loadInitialData();
        }
    }

    async bindEvents() {
        document.addEventListener("program:selected", (e) => {
            this.handleProgramSelected(e.detail.data);
        });

        document.addEventListener("class:selected", (e) => {
            this.handleClassSelected(e.detail.data);
        });

        document.addEventListener("class:new", () => {
            this.handleNewClass();
        });

        document.addEventListener("class:save", (e) => {
            this.handleClassSave(e.detail.data);
        });

        document.addEventListener("groups:assigned", (e) => {
            this.handleGroupsAssigned(e.detail.data);
        });

        document.addEventListener("group:removed", (e) => {
            this.handleGroupRemoved(e.detail.data);
        });
    }

    async loadInitialData() {
        try {
            Toast.info("Initializing class management...");
            await initializeModels([Class, Program, Group, Modality, Course]);
            Toast.success("Class management initialized successfully");
        } catch (error) {
            Toast.error("Failed to initialize class management", error);
        }
    }

    async handleProgramSelected(programData) {
        this.currentProgram = await Program.getById(programData.id);

        this.classList.setOptions({
            disabled: false,
            programId: programData.id,
        });

        this.classEditor.setOptions({
            disabled: true,
            program: this.currentProgram,
            classData: null,
        });

        this.selectedClass = null;

        Toast.info(`Selected program: ${this.currentProgram.name}`);
    }

    async handleClassSelected(classData) {
        this.selectedClass = await Class.getById(classData.id);

        this.classEditor.setOptions({
            disabled: false,
            program: this.currentProgram,
            classData: this.selectedClass,
        });

        Toast.info(`Selected class: ${classData.name || `#${classData.id}`}`);
    }

    async handleNewClass() {
        if (!this.currentProgram) {
            Toast.warning("Please select a program first");
            return;
        }

        this.selectedClass = null;
        this.classEditor.setOptions({
            disabled: false,
            program: this.currentProgram,
            classData: null,
            isNew: true,
        });

        Toast.info("Creating new class");
    }

    async handleClassSave(classSaveData) {
        try {
            await this.classList.refreshClasses();

            if (classSaveData.isNew) {
                Toast.success("New class created successfully");
            } else {
                Toast.success("Class updated successfully");
            }

            if (classSaveData.isNew && classSaveData.classId) {
                const newClass = await Class.getById(classSaveData.classId);
                this.handleClassSelected({
                    id: newClass.id,
                    name: newClass.name || `Class #${newClass.id}`,
                });
            }
        } catch (error) {
            Toast.error("Failed to save class changes", error);
        }
    }

    async handleGroupsAssigned(groupAssignmentData) {
        try {
            if (this.selectedClass) {
                this.classEditor.refreshGroups();
                Toast.success(
                    `Assigned ${groupAssignmentData.count} group(s) to class`,
                );
            }
        } catch (error) {
            Toast.error("Failed to process group assignment", error);
        }
    }

    async handleGroupRemoved(groupRemovalData) {
        try {
            if (this.selectedClass) {
                this.classEditor.refreshGroups();
                Toast.success(`Removed group from class`);
            }
        } catch (error) {
            Toast.error("Failed to process group removal", error);
        }
    }
}
