import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Student } from "../../models/Student.js";
import { Group } from "../../models/Group.js";

export class UnassignedStudents extends BaseComponent {
    getDefaultOptions() {
        return {
            students: [],
            groups: [],
            program: null,
            groupStudentCounts: new Map(),
        };
    }

    async loadUnassignedStudents() {
        try {
            if (!this.options.program) return;

            const unassignedStudents = await Student.getWithoutGroup(
                this.options.program.id,
            );
            this.options.students = unassignedStudents;
        } catch (error) {
            console.error("Failed to load unassigned students:", error);
            Toast.error("Failed to load unassigned students", error);
            this.options.students = [];
        }
    }

    async render() {
        if (this.options.program) {
            await this.loadUnassignedStudents();
        }

        if (!this.options.program) {
            this.container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    Select a program to view unassigned students
                </div>
            `;
            return;
        }

        const { students } = this.options;

        if (students.length === 0) {
            this.container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    No unassigned students
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-gray-700 font-medium">${students.length} Unassigned Students</span>
                    <button id="${this.getId("assign-all-btn")}" class="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                        Assign All
                    </button>
                </div>
                <div id="${this.getId("students-container")}" class="space-y-3 max-h-96 overflow-y-auto">
                    ${this.renderStudentsList()}
                </div>
            </div>
        `;
    }

    async setOptions(newOptions) {
        super.setOptions(newOptions);

        if (this.initialized) {
            await this.render();
            await this.bindEvents();
        }
    }

    renderStudentsList() {
        return this.options.students
            .map(
                (student) => `
            <div class="student-item flex items-center justify-between p-3 bg-gray-50 rounded" data-student-id="${student.id}">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    ${student.name}
                </span>
                <select
                    class="unassigned-student-group-select border-gray-300 rounded py-1 text-sm"
                    data-student-id="${student.id}"
                >
                    <option value="unassigned" selected>Unassigned</option>
                    ${this.options.groups
                        .map(
                            (group) => `
                        <option value="${group.id}">${group.name}</option>
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
        const studentsContainer = document.getElementById(
            this.getId("students-container"),
        );
        if (studentsContainer) {
            studentsContainer.addEventListener("change", (e) => {
                if (
                    e.target.classList.contains(
                        "unassigned-student-group-select",
                    )
                ) {
                    this.handleStudentGroupChange(e.target);
                }
            });
        }

        const assignAllBtn = document.getElementById(
            this.getId("assign-all-btn"),
        );
        if (assignAllBtn) {
            assignAllBtn.addEventListener("click", () => {
                this.handleAssignAllStudents();
            });
        }
    }

    async handleStudentGroupChange(selectElement) {
        const studentId = selectElement.dataset.studentId;
        const newGroupId = selectElement.value;

        if (newGroupId === "unassigned") return;

        try {
            const targetGroup = this.options.groups.find(
                (g) => String(g.id) === String(newGroupId),
            );
            if (!targetGroup) {
                throw new Error("Target group not found");
            }

            await new Group(targetGroup).assignStudent(studentId);

            const studentElement = selectElement.closest(".student-item");

            this.notifyChange("student:moved", {
                studentId,
                fromGroupId: "unassigned",
                toGroupId: newGroupId,
                studentName: studentElement
                    .querySelector("span")
                    .textContent.trim(),
            });

            if (studentElement) {
                studentElement.remove();
            }

            const studentIndex = this.options.students.findIndex(
                (s) => s.id === studentId,
            );
            if (studentIndex !== -1) {
                this.options.students.splice(studentIndex, 1);
            }

            this.updateStudentCount();
        } catch (error) {
            console.error("Failed to assign student:", error);
            Toast.error("Failed to assign student to group");
            selectElement.value = "unassigned";
        }
    }

    updateStudentCount() {
        const studentCountElement = this.container.querySelector(
            ".text-gray-700.font-medium",
        );
        if (studentCountElement) {
            studentCountElement.textContent = `${this.options.students.length} Unassigned Students`;
        }

        if (this.options.students.length === 0) {
            const studentsContainer = document.getElementById(
                this.getId("students-container"),
            );
            if (studentsContainer) {
                studentsContainer.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        No unassigned students
                    </div>
                `;
            }
        }
    }

    handleAssignAllStudents() {
        if (
            this.options.students.length === 0 ||
            this.options.groups.length === 0
        ) {
            Toast.warning("No students to assign or no groups available");
            return;
        }

        this.showAssignmentDialog();
    }

    showAssignmentDialog() {
        const dialogContent = document.createElement("div");
        dialogContent.innerHTML = `
            <div class="p-4">
                <h3 class="text-lg font-medium mb-4">Assign All Unassigned Students</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Assignment Method
                        </label>
                        <select id="${this.getId("assignment-method")}" class="block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="distribute">Distribute Evenly</option>
                            <option value="single-group">Assign to a Single Group</option>
                        </select>
                    </div>

                    <div id="${this.getId("group-selection")}" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Select Group
                        </label>
                        <select id="${this.getId("target-group")}" class="block w-full border-gray-300 rounded-md shadow-sm">
                            ${this.options.groups
                                .map((group) => {
                                    // Get student count from the map or default to 0
                                    const studentCount =
                                        this.options.groupStudentCounts.get(
                                            group.id,
                                        ) || 0;
                                    return `
                                        <option value="${group.id}">${group.name} (${studentCount} students)</option>
                                    `;
                                })
                                .join("")}
                        </select>
                    </div>
                </div>
            </div>
        `;

        const methodListener = () => {
            const methodSelect = dialogContent.querySelector(
                `#${this.getId("assignment-method")}`,
            );
            const groupSelection = dialogContent.querySelector(
                `#${this.getId("group-selection")}`,
            );

            if (methodSelect.value === "single-group") {
                groupSelection.classList.remove("hidden");
            } else {
                groupSelection.classList.add("hidden");
            }
        };

        setTimeout(() => {
            const methodSelect = dialogContent.querySelector(
                `#${this.getId("assignment-method")}`,
            );
            if (methodSelect) {
                methodSelect.addEventListener("change", methodListener);
            }
        }, 100);

        const modal = document.createElement("div");
        modal.className = "fixed inset-0 flex items-center justify-center z-50";
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50"></div>
            <div class="bg-white rounded-lg shadow-xl z-10 max-w-md w-full">
                <div id="dialog-content"></div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button id="confirm-assign" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Assign Students
                    </button>
                    <button id="cancel-assign" type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const dialogContainer = modal.querySelector("#dialog-content");
        dialogContainer.appendChild(dialogContent);

        const confirmBtn = modal.querySelector("#confirm-assign");
        const cancelBtn = modal.querySelector("#cancel-assign");

        confirmBtn.addEventListener("click", () => {
            const methodSelect = dialogContent.querySelector(
                `#${this.getId("assignment-method")}`,
            );
            const targetGroupSelect = dialogContent.querySelector(
                `#${this.getId("target-group")}`,
            );

            const method = methodSelect.value;
            const targetGroupId = targetGroupSelect?.value;

            this.assignAllStudents(method, targetGroupId);
            document.body.removeChild(modal);
        });

        cancelBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
    }

    assignAllStudents(method, targetGroupId) {
        if (method === "single-group" && targetGroupId) {
            const studentsToAssign = [...this.options.students];

            for (const student of studentsToAssign) {
                this.notifyChange("student:moved", {
                    studentId: student.id,
                    fromGroupId: "unassigned",
                    toGroupId: targetGroupId,
                    studentName: student.name,
                });
            }

            this.options.students = [];

            this.render();

            Toast.success(
                `Assigned all students to group: ${this.getGroupName(targetGroupId)}`,
            );
        } else if (method === "distribute") {
            this.distributeStudents();
            this.options.students = [];
            this.render();
        }
    }

    distributeStudents() {
        if (this.options.groups.length === 0) {
            Toast.warning("No groups available for distribution");
            return;
        }

        const groups = this.options.groups.map((group) => ({
            id: group.id,
            name: group.name,
            studentCount: this.options.groupStudentCounts.get(group.id) || 0,
        }));

        const studentsToDistribute = [...this.options.students];
        for (const student of studentsToDistribute) {
            groups.sort((a, b) => a.studentCount - b.studentCount);
            const targetGroup = groups[0];
            targetGroup.studentCount++;

            this.notifyChange("student:moved", {
                studentId: student.id,
                fromGroupId: "unassigned",
                toGroupId: targetGroup.id,
                studentName: student.name,
            });
        }

        Toast.success("Students distributed evenly across groups");
    }

    getStudentName(studentId) {
        const student = this.options.students.find((s) => s.id === studentId);
        return student ? student.name : "Unknown Student";
    }

    getGroupName(groupId) {
        const group = this.options.groups.find((g) => g.id === groupId);
        return group ? group.name : "Unknown Group";
    }
}
