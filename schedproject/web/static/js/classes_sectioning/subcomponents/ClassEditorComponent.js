import { BaseComponent } from "../../components/BaseComponent.js";
import { ModalComponent } from "../../components/ModalComponent.js";
import { Toast } from "../../components/Toast.js";
import { Class } from "../../models/Class.js";
import { ModalitySelector } from "./ModalitySelector.js";
import { GroupAssignmentComponent } from "./GroupAssignmentComponent.js";

export class ClassEditorComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            disabled: true,
            program: null,
            classData: null,
            isNew: false,
        };
    }

    async beforeRender() {
        this.modal = null;

        if (this.options.classData && !this.options.disabled) {
            try {
                this.classDetails = await this.options.classData.getDetails();
            } catch (error) {
                Toast.error("Failed to load class details", error);
                this.classDetails = null;
            }
        } else {
            this.classDetails = null;
        }

        if (this.options.isNew && !this.options.disabled) {
            this.classDetails = {
                class: {
                    name: "",
                    description: "",
                },
                modalities: [],
                groups: [],
                programs: [],
            };
        }
    }

    async render() {
        if (this.options.disabled) {
            this.container.innerHTML = `
                <div class="opacity-50 pointer-events-none">
                    <h2 class="text-xl font-semibold mb-4">Class Details</h2>
                    <p class="text-gray-500 text-center py-4">Select a class or create a new one</p>
                </div>
            `;
            return;
        }

        const isNew = this.options.isNew;
        const classData = this.classDetails?.class || {};

        this.container.innerHTML = `
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">
                        ${isNew ? "Create New Class" : "Edit Class"}
                    </h2>
                    <div class="space-x-2">
                        ${
                            !isNew
                                ? `
                            <button id="${this.getId("delete-btn")}"
                                class="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Delete Class
                            </button>
                        `
                                : ""
                        }
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-white rounded-lg border p-4">
                        <h3 class="text-lg font-medium mb-4">Basic Information</h3>
                        <div class="space-y-4">
                            <div>
                                <label for="${this.getId("class-name")}" class="block text-sm font-medium text-gray-700">
                                    Class Name
                                </label>
                                <input type="text" id="${this.getId("class-name")}"
                                    value="${classData.name || ""}"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            </div>

                            <div>
                                <label for="${this.getId("class-description")}" class="block text-sm font-medium text-gray-700">
                                    Description (Optional)
                                </label>
                                <textarea id="${this.getId("class-description")}" rows="3"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">${classData.description || ""}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-medium">Class Modalities</h3>
                            <button id="${this.getId("select-modalities-btn")}"
                                class="text-sm text-indigo-600 hover:text-indigo-900">
                                ${this.classDetails?.modalities?.length > 0 ? "Change Modalities" : "Select Modalities"}
                            </button>
                        </div>

                        <div id="${this.getId("modalities-container")}" class="space-y-2">
                            ${this.renderModalities()}
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border p-4">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-medium">Assigned Groups</h3>
                            <button id="${this.getId("assign-groups-btn")}"
                                class="text-sm text-indigo-600 hover:text-indigo-900">
                                ${this.classDetails?.groups?.length > 0 ? "Manage Groups" : "Assign Groups"}
                            </button>
                        </div>

                        <div id="${this.getId("groups-container")}" class="space-y-2">
                            ${this.renderGroups()}
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border p-4">
                        <h3 class="text-lg font-medium mb-4">Programs</h3>
                        <div id="${this.getId("programs-container")}" class="space-y-2">
                            ${this.renderPrograms()}
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3">
                        <button id="${this.getId("cancel-btn")}"
                            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cancel
                        </button>
                        <button id="${this.getId("save-btn")}"
                            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            ${isNew ? "Create Class" : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById(this.getId("modal-container"))) {
            const modalContainer = document.createElement("div");
            modalContainer.id = this.getId("modal-container");
            this.container.appendChild(modalContainer);
        }

        this.modal = new ModalComponent(
            document.getElementById(this.getId("modal-container")),
        );
    }

    async bindEvents() {
        if (this.options.disabled) return;

        const saveBtn = document.getElementById(this.getId("save-btn"));
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                this.saveClass();
            });
        }

        const cancelBtn = document.getElementById(this.getId("cancel-btn"));
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                this.notifyChange("class:cancel");
            });
        }

        const deleteBtn = document.getElementById(this.getId("delete-btn"));
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                this.confirmDeleteClass();
            });
        }

        const selectModalitiesBtn = document.getElementById(
            this.getId("select-modalities-btn"),
        );
        if (selectModalitiesBtn) {
            selectModalitiesBtn.addEventListener("click", () => {
                this.openModalitySelector();
            });
        }

        const assignGroupsBtn = document.getElementById(
            this.getId("assign-groups-btn"),
        );
        if (assignGroupsBtn) {
            assignGroupsBtn.addEventListener("click", () => {
                this.openGroupAssignment();
            });
        }
    }

    renderModalities() {
        const modalities = this.classDetails?.modalities || [];

        if (modalities.length === 0) {
            return `
                <div class="text-sm text-gray-500 text-center py-2">
                    No modalities selected. Click "Select Modalities" to add course modalities to this class.
                </div>
            `;
        }

        return modalities
            .map(
                (modality) => `
            <div class="flex justify-between items-center border-b pb-2">
                <div>
                    <span class="text-sm font-medium">${modality.modality}</span>
                    <span class="text-xs text-gray-500 ml-2">${modality.hours || 0} hours</span>
                </div>
                <div>
                    <button class="text-xs text-red-600 hover:text-red-900 remove-modality-btn"
                        data-modality-id="${modality.id}">
                        Remove
                    </button>
                </div>
            </div>
        `,
            )
            .join("");
    }

    renderGroups() {
        const groups = this.classDetails?.groups || [];

        if (groups.length === 0) {
            return `
                <div class="text-sm text-gray-500 text-center py-2">
                    No groups assigned. Click "Assign Groups" to add groups to this class.
                </div>
            `;
        }

        return groups
            .map(
                (group) => `
            <div class="flex justify-between items-center border-b pb-2">
                <div>
                    <span class="text-sm font-medium">${group.name}</span>
                    <span class="text-xs text-gray-500 ml-2">Program: ${this.getProgramName(group.program_id)}</span>
                </div>
                <div>
                    <button class="text-xs text-red-600 hover:text-red-900 remove-group-btn"
                        data-group-id="${group.id}">
                        Remove
                    </button>
                </div>
            </div>
        `,
            )
            .join("");
    }

    renderPrograms() {
        const programs = this.classDetails?.programs || [];

        if (this.options.isNew) {
            return `
                <div class="text-sm text-gray-500 text-center py-2">
                    This class will be part of: <strong>${this.options.program?.name || "Unknown"}</strong>
                </div>
            `;
        }

        if (programs.length === 0) {
            return `
                <div class="text-sm text-gray-500 text-center py-2">
                    No programs associated with this class.
                </div>
            `;
        }

        return programs
            .map(
                (program) => `
            <div class="text-sm border-b pb-2">
                <span class="font-medium">${program.name}</span>
            </div>
        `,
            )
            .join("");
    }

    getProgramName(programId) {
        if (!programId) return "Unknown";

        if (this.options.program?.id == programId) {
            return this.options.program.name;
        }

        const program = this.classDetails?.programs?.find(
            (p) => p.id == programId,
        );
        return program?.name || "Unknown";
    }

    async saveClass() {
        try {
            const nameInput = document.getElementById(this.getId("class-name"));
            const descriptionInput = document.getElementById(
                this.getId("class-description"),
            );

            const name = nameInput.value.trim();
            const description = descriptionInput.value.trim();

            if (!name) {
                Toast.warning("Please enter a class name");
                nameInput.focus();
                return;
            }

            if (this.options.isNew) {
                const newClass = await Class.create({
                    name,
                    description,
                });

                if (this.classDetails.modalities.length > 0) {
                    const modalityIds = this.classDetails.modalities.map(
                        (m) => m.id,
                    );
                    await newClass.addModalities(modalityIds);
                }

                if (this.classDetails.groups.length > 0) {
                    const groupIds = this.classDetails.groups.map((g) => g.id);
                    await newClass.addGroups(groupIds);
                }

                Toast.success("Class created successfully");

                this.notifyChange("class:save", {
                    isNew: true,
                    classId: newClass.id,
                });
            } else {
                const classToUpdate = this.options.classData;
                classToUpdate.name = name;
                classToUpdate.description = description;

                await classToUpdate.save();

                Toast.success("Class updated successfully");

                this.notifyChange("class:save", {
                    isNew: false,
                    classId: classToUpdate.id,
                });
            }
        } catch (error) {
            Toast.error(
                `Failed to ${this.options.isNew ? "create" : "update"} class`,
                error,
            );
        }
    }

    async confirmDeleteClass() {
        if (!this.options.classData || this.options.isNew) return;

        this.modal.setOptions({
            title: "Confirm Delete",
            content: `
                <div class="p-4">
                    <p>Are you sure you want to delete this class?</p>
                    <p class="text-sm text-red-600 mt-2">This action cannot be undone.</p>
                </div>
            `,
            buttons: [
                {
                    text: "Cancel",
                    handler: () => this.modal.close(),
                },
                {
                    text: "Delete",
                    handler: () => this.deleteClass(),
                },
            ],
        });

        this.modal.open();
    }

    async deleteClass() {
        if (!this.options.classData) return;

        try {
            await this.options.classData.delete();

            this.modal.close();
            Toast.success("Class deleted successfully");

            this.notifyChange("class:deleted", {
                classId: this.options.classData.id,
            });

            this.options.classData = null;
            this.options.isNew = false;
            this.classDetails = null;

            await this.render();
            await this.bindEvents();
        } catch (error) {
            Toast.error("Failed to delete class", error);
        }
    }

    async openModalitySelector() {
        const modalityContainer = document.createElement("div");
        const modalitySelector = new ModalitySelector(modalityContainer, {
            program: this.options.program,
            selectedModalities: this.classDetails?.modalities || [],
        });

        this.modal.setOptions({
            title: "Select Modalities",
            content: modalitySelector,
            buttons: [
                {
                    text: "Cancel",
                    handler: () => this.modal.close(),
                },
                {
                    text: "Confirm Selection",
                    handler: () =>
                        this.applyModalitySelection(modalitySelector),
                },
            ],
        });

        await modalitySelector.init();
        this.modal.open();
    }

    async applyModalitySelection(modalitySelector) {
        try {
            const selectedModalities = modalitySelector.getSelectedModalities();

            this.classDetails.modalities = selectedModalities;

            if (this.options.classData && !this.options.isNew) {
                const modalityIds = selectedModalities.map((m) => m.id);

                await this.options.classData.addModalities(modalityIds);

                Toast.success("Modalities updated successfully");
            }

            this.modal.close();

            const modalitiesContainer = document.getElementById(
                this.getId("modalities-container"),
            );
            if (modalitiesContainer) {
                modalitiesContainer.innerHTML = this.renderModalities();
            }

            await this.refreshPrograms();
        } catch (error) {
            Toast.error("Failed to update modalities", error);
        }
    }

    async openGroupAssignment() {
        const groupContainer = document.createElement("div");
        const groupAssignment = new GroupAssignmentComponent(groupContainer, {
            program: this.options.program,
            classData: this.options.classData,
            classDetails: this.classDetails,
            isNew: this.options.isNew,
        });

        this.modal.setOptions({
            title: "Assign Groups",
            content: groupAssignment,
            buttons: [
                {
                    text: "Close",
                    handler: () => this.modal.close(),
                },
            ],
        });

        await groupAssignment.init();
        this.modal.open();
    }

    async refreshGroups() {
        if (!this.options.classData || this.options.isNew) return;

        try {
            this.classDetails = await this.options.classData.getDetails();

            const groupsContainer = document.getElementById(
                this.getId("groups-container"),
            );
            if (groupsContainer) {
                groupsContainer.innerHTML = this.renderGroups();
            }

            await this.refreshPrograms();
        } catch (error) {
            Toast.error("Failed to refresh groups", error);
        }
    }

    async refreshPrograms() {
        if (!this.options.classData && !this.options.isNew) return;

        if (this.options.isNew) return;

        try {
            this.classDetails = await this.options.classData.getDetails();

            const programsContainer = document.getElementById(
                this.getId("programs-container"),
            );
            if (programsContainer) {
                programsContainer.innerHTML = this.renderPrograms();
            }
        } catch (error) {
            Toast.error("Failed to refresh programs", error);
        }
    }
}
