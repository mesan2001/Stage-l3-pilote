import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Group } from "../../models/Group.js";
import { Modality } from "../../models/Modality.js";

export class GroupAssignmentComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            program: null,
            classData: null,
            classDetails: null,
            isNew: false,
            search: "",
        };
    }

    async beforeRender() {
        this.programGroups = [];
        this.assignedGroupIds = new Set();
        this.relatedPrograms = [];
        this.selectedProgram = this.options.program?.id;

        await this.loadProgramGroups();
        await this.loadRelatedPrograms();

        if (this.options.classDetails?.groups) {
            this.options.classDetails.groups.forEach((group) => {
                this.assignedGroupIds.add(group.id.toString());
            });
        }
    }

    async render() {
        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="flex space-x-2">
                    <div class="flex-1">
                        <input type="text" id="${this.getId("search-input")}"
                            placeholder="Search groups..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <button id="${this.getId("clear-btn")}"
                        class="px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Clear
                    </button>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Program
                    </label>
                    <select id="${this.getId("program-filter")}"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="${this.options.program?.id}">
                            ${this.options.program?.name || "Current Program"}
                        </option>

                        ${this.relatedPrograms
                            .filter((p) => p.id != this.options.program?.id)
                            .map(
                                (program) => `
                                <option value="${program.id}">${program.name}</option>
                            `,
                            )
                            .join("")}

                        <option value="all">All Compatible Programs</option>
                    </select>
                </div>

                <div id="${this.getId("groups-container")}" class="border rounded-md">
                    <div class="border-b bg-gray-50 px-4 py-2 flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">Groups</span>
                        <span class="text-xs text-gray-500">
                            ${this.assignedGroupIds.size} assigned / ${this.programGroups.length} available
                        </span>
                    </div>
                    <div class="max-h-[300px] overflow-y-auto p-2 space-y-2">
                        ${this.renderGroups()}
                    </div>
                </div>

                <div class="flex justify-between">
                    <button id="${this.getId("assign-all-btn")}"
                        class="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-900">
                        Assign All Visible Groups
                    </button>
                    <button id="${this.getId("clear-all-btn")}"
                        class="px-3 py-2 text-sm text-red-600 hover:text-red-900">
                        Clear All Assignments
                    </button>
                </div>

                <div class="border rounded-md">
                    <div class="border-b bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                        Assigned Groups Summary
                    </div>
                    <div id="${this.getId("assigned-summary")}" class="p-4 space-y-2">
                        ${this.renderAssignedSummary()}
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
                this.updateGroupsDisplay();
            });
        }

        const clearBtn = document.getElementById(this.getId("clear-btn"));
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                this.options.search = "";
                if (searchInput) searchInput.value = "";
                this.updateGroupsDisplay();
            });
        }

        const programFilter = document.getElementById(
            this.getId("program-filter"),
        );
        if (programFilter) {
            programFilter.addEventListener("change", async (e) => {
                this.selectedProgram = e.target.value;
                await this.loadProgramGroups();
                this.updateGroupsDisplay();
            });
        }

        const assignAllBtn = document.getElementById(
            this.getId("assign-all-btn"),
        );
        if (assignAllBtn) {
            assignAllBtn.addEventListener("click", () => {
                this.assignAllVisibleGroups();
            });
        }

        const clearAllBtn = document.getElementById(
            this.getId("clear-all-btn"),
        );
        if (clearAllBtn) {
            clearAllBtn.addEventListener("click", () => {
                this.clearAllAssignments();
            });
        }

        const groupsContainer = document.getElementById(
            this.getId("groups-container"),
        );
        if (groupsContainer) {
            groupsContainer.addEventListener("change", async (e) => {
                if (e.target.type === "checkbox") {
                    const groupId = e.target.value;

                    if (e.target.checked) {
                        await this.assignGroup(groupId);
                    } else {
                        await this.removeGroup(groupId);
                    }
                }
            });
        }

        const assignedSummary = document.getElementById(
            this.getId("assigned-summary"),
        );
        if (assignedSummary) {
            assignedSummary.addEventListener("click", async (e) => {
                if (e.target.classList.contains("remove-group-btn")) {
                    const groupId = e.target.dataset.groupId;
                    await this.removeGroup(groupId);
                }
            });
        }
    }

    async loadProgramGroups() {
        try {
            this.programGroups = [];

            if (this.selectedProgram === "all") {
                for (const program of this.relatedPrograms) {
                    const groups = await Group.getByProgram(program.id);
                    groups.forEach((group) => {
                        group.programName = program.name;
                        group.programId = program.id;
                    });
                    this.programGroups.push(...groups);
                }
            } else {
                const programId =
                    this.selectedProgram || this.options.program?.id;
                if (!programId) return;

                const groups = await Group.getByProgram(programId);
                const programName = this.getProgramName(programId);

                groups.forEach((group) => {
                    group.programName = programName;
                    group.programId = programId;
                });

                this.programGroups = groups;
            }
        } catch (error) {
            Toast.error("Failed to load groups", error);
            this.programGroups = [];
        }
    }

    async loadRelatedPrograms() {
        if (!this.options.classDetails?.modalities?.length) {
            this.relatedPrograms = [this.options.program].filter(Boolean);
            return;
        }

        try {
            const programsSet = new Set();

            if (this.options.program) {
                programsSet.add(
                    JSON.stringify({
                        id: this.options.program.id,
                        name: this.options.program.name,
                    }),
                );
            }

            for (const modality of this.options.classDetails.modalities) {
                const programs = await Modality.getRelatedPrograms(modality.id);

                for (const program of programs) {
                    programsSet.add(
                        JSON.stringify({
                            id: program.id,
                            name: program.name,
                        }),
                    );
                }
            }

            this.relatedPrograms = Array.from(programsSet).map((p) =>
                JSON.parse(p),
            );
        } catch (error) {
            Toast.error("Failed to load related programs", error);
            this.relatedPrograms = [this.options.program].filter(Boolean);
        }
    }

    getProgramName(programId) {
        if (!programId) return "Unknown";

        if (this.options.program?.id == programId) {
            return this.options.program.name;
        }

        const relatedProgram = this.relatedPrograms.find(
            (p) => p.id == programId,
        );
        return relatedProgram?.name || "Unknown Program";
    }

    renderGroups() {
        if (this.programGroups.length === 0) {
            return `
                <div class="text-center text-gray-500 py-4">
                    No groups available for this program
                </div>
            `;
        }

        const searchTerm = (this.options.search || "").toLowerCase();
        const visibleGroups = this.programGroups.filter(
            (group) =>
                !searchTerm || group.name.toLowerCase().includes(searchTerm),
        );

        if (visibleGroups.length === 0) {
            return `
                <div class="text-center text-gray-500 py-4">
                    No groups match your search
                </div>
            `;
        }

        return visibleGroups
            .map(
                (group) => `
            <div class="flex items-center justify-between border p-3 rounded-md">
                <div class="flex items-center space-x-3">
                    <input type="checkbox"
                        id="group-${group.id}"
                        value="${group.id}"
                        ${this.assignedGroupIds.has(group.id.toString()) ? "checked" : ""}>
                    <div>
                        <label for="group-${group.id}" class="block font-medium text-sm">${group.name}</label>
                        <span class="text-xs text-gray-500">${group.programName}</span>
                    </div>
                </div>
            </div>
        `,
            )
            .join("");
    }

    renderAssignedSummary() {
        if (this.assignedGroupIds.size === 0) {
            return `
                <div class="text-center text-gray-500 py-2">
                    No groups assigned to this class yet
                </div>
            `;
        }

        const assignedGroups = this.programGroups.filter((group) =>
            this.assignedGroupIds.has(group.id.toString()),
        );

        if (assignedGroups.length === 0) {
            return `
                <div class="text-center text-gray-500 py-2">
                    Assigned groups are from other programs
                </div>
            `;
        }

        const programGroups = {};

        assignedGroups.forEach((group) => {
            const programId = group.programId || group.program_id;
            if (!programGroups[programId]) {
                programGroups[programId] = {
                    name: this.getProgramName(programId),
                    groups: [],
                };
            }
            programGroups[programId].groups.push(group);
        });

        return Object.values(programGroups)
            .map(
                (program) => `
            <div class="mb-3">
                <h4 class="font-medium text-sm mb-2">${program.name}</h4>
                <div class="space-y-1 pl-4">
                    ${program.groups
                        .map(
                            (group) => `
                        <div class="flex justify-between items-center text-sm">
                            <span>${group.name}</span>
                            <button class="text-xs text-red-600 hover:text-red-900 remove-group-btn"
                                data-group-id="${group.id}">
                                Remove
                            </button>
                        </div>
                    `,
                        )
                        .join("")}
                </div>
            </div>
        `,
            )
            .join("");
    }

    updateGroupsDisplay() {
        const container = document.getElementById(
            this.getId("groups-container"),
        );
        if (container) {
            const contentDiv = container.querySelector(".max-h-\\[300px\\]");
            if (contentDiv) {
                contentDiv.innerHTML = this.renderGroups();
            }

            const counter = container.querySelector(".text-xs.text-gray-500");
            if (counter) {
                counter.textContent = `${this.assignedGroupIds.size} assigned / ${this.programGroups.length} available`;
            }
        }

        this.updateAssignedSummary();
    }

    updateAssignedSummary() {
        const summaryContainer = document.getElementById(
            this.getId("assigned-summary"),
        );
        if (summaryContainer) {
            summaryContainer.innerHTML = this.renderAssignedSummary();
        }
    }

    async assignGroup(groupId) {
        if (!groupId) return;

        try {
            if (this.options.classData && !this.options.isNew) {
                await this.options.classData.addGroups([groupId]);
            }

            this.assignedGroupIds.add(groupId.toString());
            this.updateAssignedSummary();

            this.notifyChange("groups:assigned", {
                classId: this.options.classData?.id,
                groupId,
                count: 1,
            });
        } catch (error) {
            Toast.error("Failed to assign group to class", error);

            const checkbox = document.getElementById(`group-${groupId}`);
            if (checkbox) checkbox.checked = false;
        }
    }

    async removeGroup(groupId) {
        if (!groupId) return;

        try {
            if (this.options.classData && !this.options.isNew) {
                await this.options.classData.removeGroup(groupId);
            }

            this.assignedGroupIds.delete(groupId.toString());
            this.updateGroupsDisplay();

            this.notifyChange("group:removed", {
                classId: this.options.classData?.id,
                groupId,
            });
        } catch (error) {
            Toast.error("Failed to remove group from class", error);

            const checkbox = document.getElementById(`group-${groupId}`);
            if (checkbox) checkbox.checked = true;
        }
    }

    async assignAllVisibleGroups() {
        try {
            const searchTerm = (this.options.search || "").toLowerCase();
            const visibleGroups = this.programGroups.filter(
                (group) =>
                    (!searchTerm ||
                        group.name.toLowerCase().includes(searchTerm)) &&
                    !this.assignedGroupIds.has(group.id.toString()),
            );

            if (visibleGroups.length === 0) {
                Toast.info("No new groups to assign");
                return;
            }

            const groupIds = visibleGroups.map((g) => g.id);

            if (this.options.classData && !this.options.isNew) {
                await this.options.classData.addGroups(groupIds);
            }

            groupIds.forEach((id) => this.assignedGroupIds.add(id.toString()));
            this.updateGroupsDisplay();

            this.notifyChange("groups:assigned", {
                classId: this.options.classData?.id,
                count: groupIds.length,
            });

            Toast.success(`Assigned ${groupIds.length} groups to class`);
        } catch (error) {
            Toast.error("Failed to assign groups", error);
        }
    }

    async clearAllAssignments() {
        if (this.assignedGroupIds.size === 0) {
            Toast.info("No groups assigned to clear");
            return;
        }

        try {
            if (this.options.classData && !this.options.isNew) {
                for (const groupId of this.assignedGroupIds) {
                    await this.options.classData.removeGroup(groupId);
                }
            }

            this.assignedGroupIds.clear();
            this.updateGroupsDisplay();

            this.notifyChange("groups:removed", {
                classId: this.options.classData?.id,
                all: true,
            });

            Toast.success("Cleared all group assignments");
        } catch (error) {
            Toast.error("Failed to clear group assignments", error);
        }
    }
}
