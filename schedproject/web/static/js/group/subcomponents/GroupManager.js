import { BaseComponent } from "../../components/BaseComponent.js";
import { ModalComponent } from "../../components/ModalComponent.js";
import { Toast } from "../../components/Toast.js";
import { Program } from "../../models/Program.js";
import { Group } from "../../models/Group.js";
import { Student } from "../../models/Student.js";

import { ProgramSelector } from "./ProgramSelector.js";
import { GroupList } from "./GroupList.js";
import { UnassignedStudents } from "./UnassignedStudents.js";

export class GroupManager extends BaseComponent {
    getDefaultOptions() {
        return {
            autoLoad: true,
        };
    }

    async beforeRender() {
        this.currentProgram = null;
        this.groups = [];
        this.unassignedStudents = [];
        this.programSelector = null;
        this.groupList = null;
        this.modal = null;
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-6">
                <h1 class="text-2xl font-bold text-gray-800">Group Management</h1>

                <div id="${this.getId("program-selector")}" class="bg-white p-6 rounded-lg shadow"></div>

                <div id="${this.getId("controls")}" class="bg-white p-6 rounded-lg shadow flex flex-wrap gap-4 items-center ${this.currentProgram ? "" : "hidden"}">

                    <button id="${this.getId("add-group-btn")}" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        Add Group
                    </button>

                    <button id="${this.getId("generate-students-btn")}" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                        Generate Students
                    </button>

                    <button id="${this.getId("save-btn")}" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                        Save Groups
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 ${this.currentProgram ? "" : "hidden"}" id="${this.getId("content-area")}">
                    <div id="${this.getId("group-list")}" class="md:col-span-2 bg-white p-6 rounded-lg shadow">
                        <h2 class="text-xl font-semibold mb-4">Groups</h2>
                    </div>
                    <div id="${this.getId("unassigned")}" class="bg-white p-6 rounded-lg shadow">
                        <h2 class="text-xl font-semibold mb-4">Unassigned Students</h2>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement("div");
        modalContainer.id = this.getId("modal-container");
        this.container.appendChild(modalContainer);
        this.modal = new ModalComponent(modalContainer);
    }

    async afterRender() {
        this.programSelector = new ProgramSelector(
            document.getElementById(this.getId("program-selector")),
        );
        await this.programSelector.init();
        this.groupList = new GroupList(
            document.getElementById(this.getId("group-list")),
            { groups: this.groups },
        );
        await this.groupList.init();

        this.unassignedStudentsList = new UnassignedStudents(
            document.getElementById(this.getId("unassigned")),
            {
                students: this.unassignedStudents,
                groups: this.groups,
            },
        );
        await this.unassignedStudentsList.init();

        if (this.options.autoLoad) {
            await this.programSelector.loadPrograms();
        }
    }

    async bindEvents() {
        document.addEventListener("program:selected", (e) => {
            this.handleProgramSelected(e.detail.data);
        });

        document.addEventListener("group:added", () => {
            this.handleAddGroup();
        });

        document.addEventListener("group:deleted", (e) => {
            this.handleDeleteGroup(e.detail.data);
        });

        document.addEventListener("group:renamed", (e) => {
            this.handleRenameGroup(e.detail.data);
        });

        document.addEventListener("student:moved", (e) => {
            this.handleStudentMoved(e.detail.data);
        });

        document
            .getElementById(this.getId("add-group-btn"))
            .addEventListener("click", () => {
                this.handleAddGroup();
            });

        document
            .getElementById(this.getId("generate-students-btn"))
            .addEventListener("click", () => {
                this.showGenerateStudentsModal();
            });

        document
            .getElementById(this.getId("save-btn"))
            .addEventListener("click", () => {
                this.saveGroups();
            });
    }

    async handleProgramSelected(programData) {
        try {
            Toast.info(`Loading program: ${programData.name}`);
            this.currentProgram = await Program.getById(programData.id);

            document
                .getElementById(this.getId("controls"))
                .classList.remove("hidden");
            document
                .getElementById(this.getId("content-area"))
                .classList.remove("hidden");

            await this.loadGroups();

            Toast.success(`Program "${programData.name}" loaded successfully`);
        } catch (error) {
            Toast.error(`Failed to load program: ${programData.name}`, error);
        }
    }

    async loadGroups() {
        try {
            const groupsData = await Group.getByProgram(this.currentProgram.id);

            if (Object.keys(groupsData).length > 0) {
                await this.processGroupData(groupsData);
            }

            this.updateComponents();
        } catch (error) {
            Toast.error("Failed to load groups", error);
        }
    }

    async processGroupData(groupsData) {
        this.groups = [];

        groupsData.forEach((groupData) => {
            const group = new Group(groupData);
            this.groups.push(group);
        });

        this.unassignedStudents = await Student.getWithoutGroup(
            this.currentProgram.id,
        );
    }

    updateComponents() {
        this.groupList.setOptions({
            groups: this.groups,
            program: this.currentProgram,
        });

        this.unassignedStudentsList.setOptions({
            students: this.unassignedStudents,
            groups: this.groups,
            program: this.currentProgram,
        });
    }

    async handleAddGroup() {
        if (!this.currentProgram) {
            Toast.warning("Please select a program first");
            return;
        }

        try {
            const newGroupName = `Group ${this.groups.length + 1}`;

            const groupData = await Group.createGroup(
                this.currentProgram.id,
                newGroupName,
            );

            const newGroup = new Group(groupData);

            this.groups.push(newGroup);

            this.updateComponents();

            Toast.success(`Group "${newGroupName}" added`);
        } catch (error) {
            Toast.error("Failed to create group", error);
        }
    }

    async handleDeleteGroup(groupData) {
        const groupIndex = this.groups.findIndex((g) => g.id === groupData.id);
        if (groupIndex === -1) return;

        try {
            const group = this.groups[groupIndex];

            await group.delete();

            this.groups.splice(groupIndex, 1);

            await this.loadGroups();

            Toast.success(
                `Group "${groupData.name}" deleted, students moved to unassigned`,
            );
        } catch (error) {
            Toast.error("Failed to delete group", error);
        }
    }

    async handleRenameGroup(groupData) {
        const group = this.groups.find((g) => g.id === groupData.id);
        if (!group) return;

        try {
            group.name = groupData.newName;
            await group.save();
            this.updateComponents();
            Toast.success(`Group renamed to "${groupData.newName}"`);
        } catch (error) {
            Toast.error("Failed to rename group", error);
            group.name = groupData.oldName;
            this.updateComponents();
        }
    }

    async handleStudentMoved(data) {
        try {
            await this.loadGroups();
            Toast.info(`Student moved successfully`);
        } catch (error) {
            Toast.error("Failed to update groups after student move", error);
        }
    }

    async showGenerateStudentsModal() {
        if (!this.currentProgram) {
            Toast.warning("Please select a program first");
            return;
        }

        this.modal.setOptions({
            title: "Generate Students",
            content: `
                <div class="p-4">
                    <p class="mb-4">Generate random students for program: <strong>${this.currentProgram.name}</strong></p>

                    <div class="mb-4">
                    <label for="student-count" class="block text-sm font-medium text-gray-700 mb-1">Number of students to generate:</label>
                    <input type="number" id="student-count" min="1" max="100" value="20"
                    class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    </div>

                    <div class="mb-4">
                    <p class="text-sm text-gray-500">Note: This will create randomly generated student data for testing purposes.</p>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: "Cancel",
                    handler: (_, modal) => {
                        modal.close();
                    },
                },
                {
                    text: "Generate",
                    handler: async (_, modal) => {
                        const countInput = modal
                            .getContentElement()
                            .querySelector("#student-count");
                        const count = parseInt(countInput.value, 10);

                        if (isNaN(count) || count < 1) {
                            Toast.warning(
                                "Please enter a valid number of students",
                            );
                            return;
                        }

                        modal.close();
                        await this.generateStudents(count);
                    },
                },
            ],
        });
        this.modal.open();
    }

    async generateStudents(count) {
        if (!this.currentProgram) {
            Toast.warning("No program selected");
            return;
        }

        try {
            Toast.info(
                `Generating ${count} students for program "${this.currentProgram.name}"...`,
            );

            await Student.generate(this.currentProgram.id, count);
            Toast.success(`Successfully generated ${count} students`);
            await this.loadGroups();
        } catch (error) {
            Toast.error("Failed to generate students", error);
        }
    }

    async saveGroups() {
        if (!this.currentProgram) {
            Toast.warning("No program selected");
            return;
        }

        try {
            await this.loadGroups();
            Toast.success("Groups saved successfully");
        } catch (error) {
            Toast.error("Failed to save groups", error);
        }
    }
}
