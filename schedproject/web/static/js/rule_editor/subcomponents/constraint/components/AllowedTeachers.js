import { BaseConstraint } from "./BaseConstraint.js";
import { GenericChain } from "../inputs/GenericChain.js";
import { Lecturer } from "../../../../models/Lecturer.js";

export default class AllowedTeachers extends BaseConstraint {
    static ID = "ALLOWED_TEACHERS";

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
        this.containsCatalogConstraint = ["forbidden_teachers"];

        await Lecturer.init();
    }

    async render() {
        await super.render();

        const wrapper = document.createElement("div");
        wrapper.className = "allowed-teachers-constraint";

        const description = document.createElement("div");
        description.className = "mb-4 text-gray-600";
        description.textContent =
            "Select teachers who will be allowed to conduct the sessions. Sessions can only be assigned to these teachers.";
        wrapper.appendChild(description);

        const teacherSelectorContainer = document.createElement("div");
        wrapper.appendChild(teacherSelectorContainer);

        const teacherSelector = new GenericChain(teacherSelectorContainer, {
            model: Lecturer,
            searchColumn: "name",
            displayColumn: "name",
            infoColumn: "lastname",
            placeholder: "Search for teachers...",
            label: "Allowed Teachers",
            required: true,
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
            "Select at least one teacher who will be allowed to conduct the sessions.";
        wrapper.appendChild(validationMsg);

        this.container.appendChild(wrapper);
    }

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

    async bindEvents() {}

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
