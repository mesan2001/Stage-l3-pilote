import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Group } from "../../models/Group.js";

export class GroupItem extends BaseComponent {
    getDefaultOptions() {
        return {
            group: null,
            program: null,
            expanded: false,
            availableGroups: [],
        };
    }

    async render() {
        if (!this.options.group) {
            this.container.innerHTML = `<div class="text-gray-500">Invalid group data</div>`;
            return;
        }

        const { group, expanded } = this.options;

        let students = await this.options.group.getStudents();

        this.container.innerHTML = `
            <div class="bg-white p-4 rounded-md shadow mb-4 border border-gray-200">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                        <input
                            type="text"
                            id="${this.getId("group-name")}"
                            class="text-xl font-bold group-name-input border-gray-300 rounded px-2 py-1"
                            value="${group.name}"
                        >
                        <span class="text-sm text-gray-500">(${students.length} students)</span>
                    </div>
                    <div class="space-x-2">
                        <button
                            id="${this.getId("toggle-btn")}"
                            class="toggle-group-btn px-2 py-1 bg-blue-500 text-white rounded">
                            ${expanded ? "Hide Students" : "Show Students"}
                        </button>
                        <button
                            id="${this.getId("delete-btn")}"
                            class="delete-group-btn px-2 py-1 bg-red-500 text-white rounded">
                            Delete Group
                        </button>
                    </div>
                </div>

                <div id="${this.getId("students-container")}" class="mt-4 space-y-2 ${expanded ? "" : "hidden"}">
                    ${this.renderStudentsList(students)}
                </div>
            </div>
        `;
    }

    renderStudentsList(students) {
        if (!students || students.length === 0) {
            return `<div class="text-gray-500 text-center py-2">No students in this group</div>`;
        }

        return students
            .map(
                (student) => `
            <div class="student-item flex items-center justify-between p-2 hover:bg-gray-50 rounded" data-student-id="${student.id}">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    ${student.name}
                </span>
                <select
                    class="student-group-select border-gray-300 rounded py-1 text-sm"
                    data-student-id="${student.id}"
                >
                    <option value="unassigned">Unassigned</option>
                    ${this.options.availableGroups
                        .map(
                            (g) => `
                        <option value="${g.id}" ${g.id === this.options.group.id ? "selected" : ""}>
                            ${g.name}
                        </option>
                    `,
                        )
                        .join("")}
                </select>
            </div>
        `,
            )
            .join("");
    }

    async bindEvents() {
        const groupNameInput = document.getElementById(
            this.getId("group-name"),
        );
        if (groupNameInput) {
            groupNameInput.addEventListener("change", (e) => {
                this.handleGroupNameChange(e.target.value);
            });
        }

        const toggleBtn = document.getElementById(this.getId("toggle-btn"));
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                this.toggleStudents();
            });
        }

        const deleteBtn = document.getElementById(this.getId("delete-btn"));
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                this.handleDeleteGroup();
            });
        }

        const studentsContainer = document.getElementById(
            this.getId("students-container"),
        );
        if (studentsContainer) {
            studentsContainer.addEventListener("change", (e) => {
                if (e.target.classList.contains("student-group-select")) {
                    this.handleStudentGroupChange(e.target);
                }
            });
        }
    }

    handleGroupNameChange(newName) {
        if (!newName.trim()) {
            document.getElementById(this.getId("group-name")).value =
                this.options.group.name;
            return;
        }

        if (newName !== this.options.group.name) {
            this.notifyChange("group:renamed", {
                id: this.options.group.id,
                newName: newName.trim(),
                oldName: this.options.group.name,
            });

            this.options.group.name = newName.trim();
        }
    }

    async toggleStudents() {
        const studentsContainer = document.getElementById(
            this.getId("students-container"),
        );
        const toggleBtn = document.getElementById(this.getId("toggle-btn"));

        if (!studentsContainer || !toggleBtn) {
            console.warn("Could not find students container or toggle button");
            return;
        }

        this.options.expanded = !this.options.expanded;

        if (this.options.expanded) {
            try {
                const students = await this.options.group.getStudents();
                studentsContainer.innerHTML = this.renderStudentsList(students);
                studentsContainer.classList.remove("hidden");
                toggleBtn.textContent = "Hide Students";
            } catch (error) {
                Toast.error("Failed to load students for this group");
                this.options.expanded = false; // Revert expansion state
                return;
            }
        } else {
            studentsContainer.classList.add("hidden");
            toggleBtn.textContent = "Show Students";
        }

        this.notifyChange("group:toggle", {
            groupId: this.options.group.id,
            expanded: this.options.expanded,
        });
    }

    handleDeleteGroup() {
        if (
            confirm(
                `Are you sure you want to delete the group "${this.options.group.name}"?`,
            )
        ) {
            this.notifyChange("group:deleted", {
                id: this.options.group.id,
                name: this.options.group.name,
            });
        }
    }

    async handleStudentGroupChange(selectElement) {
        const studentId = selectElement.dataset.studentId;
        const newGroupId = selectElement.value;

        if (newGroupId === this.options.group.id) return;

        try {
            await Group.removeStudentFromGroups(studentId);

            if (newGroupId !== "unassigned") {
                const targetGroup = this.options.availableGroups.find(
                    (g) => g.id === newGroupId,
                );
                if (targetGroup) {
                    await new Group(targetGroup).assignStudent(studentId);
                }
            }

            this.notifyChange("student:moved", {
                studentId,
                fromGroupId: this.options.group.id,
                toGroupId: newGroupId,
                studentName: selectElement
                    .closest(".student-item")
                    .querySelector("span")
                    .textContent.trim(),
            });

            const studentItem = selectElement.closest(".student-item");
            if (studentItem) {
                studentItem.remove();
            }
        } catch (error) {
            console.error("Failed to move student:", error);
            Toast.error("Failed to move student to new group");
            selectElement.value = this.options.group.id;
        }
    }

    getStudentName(studentId) {
        const studentItem = this.container.querySelector(
            `.student-item[data-student-id="${studentId}"]`,
        );
        if (studentItem) {
            return studentItem.querySelector("span").textContent.trim();
        }
        return "Unknown Student";
    }
}
