import { BaseConstraint } from "./BaseConstraint.js";
import { GenericChain } from "../inputs/GenericChain.js";
import { Lecturer } from "../../../../models/Lecturer.js";

export default class RequiredTeachers extends BaseConstraint {
    static ID = "REQUIRED_TEACHERS";

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            data: {},
        };
    }

    async beforeRender() {
        await super.beforeRender();
        this.data = this.options.data || {};
        this.components = new Map();

        // Ensure the Lecturer model is initialized
        await Lecturer.init();
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "required-teachers-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select teachers who are required to conduct the sessions. Sessions must be assigned to these teachers.";
        wrapper.appendChild(description);

        const teacherSelectorContainer = document.createElement("div");
        wrapper.appendChild(teacherSelectorContainer);

        const teacherSelector = new GenericChain(teacherSelectorContainer, {
            model: Lecturer,
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "lastname",
            placeholder: "Search for teachers...",
            label: "Required Teachers",
            required: true,
            // Populate with existing data if available
            data: this.data.teachers
                ? await this._loadTeacherData(this.data.teachers)
                : [],
            validators: [
                (value) => {
                    if (!value || value.length === 0) {
                        return false;
                    }
                    return true;
                },
            ],
        });

        await teacherSelector.init();
        this.components.set("teachers", teacherSelector);

        const validationMsg = document.createElement("div");
        validationMsg.className = "mt-2 text-sm text-gray-500";
        validationMsg.textContent =
            "Select at least one teacher who must conduct the sessions.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

    // Helper method to load teacher data from IDs
    async _loadTeacherData(teacherIds) {
        if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
            return [];
        }

        try {
            const teachers = await Promise.all(
                teacherIds.map((id) => Lecturer.getById(id)),
            );
            return teachers.filter((teacher) => teacher !== null);
        } catch (error) {
            console.error("Error loading teacher data:", error);
            return [];
        }
    }

    async bindEvents() {
        // Add event bindings if needed
    }

    getValue() {
        const teachers = this.components.get("teachers");
        return {
            teachers: teachers ? teachers.getValue() : [],
        };
    }

    validate() {
        return Array.from(this.components.values()).every((component) =>
            component.validate(),
        );
    }

    onDestroy() {
        this.components.forEach((component) => {
            if (component.destroy && typeof component.destroy === "function") {
                component.destroy();
            }
        });
        this.components.clear();
    }
}
