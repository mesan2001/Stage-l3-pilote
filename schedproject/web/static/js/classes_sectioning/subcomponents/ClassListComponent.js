import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { Class } from "../../models/Class.js";

export class ClassListComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            disabled: true,
            programId: null,
            classes: [],
        };
    }

    async setOptions(newOptions) {
        const prevProgramId = this.options.programId;
        const prevDisabled = this.options.disabled;

        Object.assign(this.options, newOptions);

        if (
            (prevProgramId !== this.options.programId &&
                this.options.programId) ||
            (prevDisabled && !this.options.disabled)
        ) {
            await this.loadClasses();
        }

        if (this.initialized) {
            await this.render();
            await this.bindEvents();
        }
    }

    async beforeRender() {
        if (
            this.options.programId &&
            !this.options.disabled &&
            this.options.classes.length === 0
        ) {
            await this.loadClasses();
        }
    }

    async render() {
        if (this.options.disabled) {
            this.container.innerHTML = `
                <div class="opacity-50 pointer-events-none">
                    <h2 class="text-xl font-semibold mb-4">Classes</h2>
                    <p class="text-gray-500 text-center py-4">Select a program to view classes</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div>
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Classes</h2>
                    <button id="${this.getId("new-class-btn")}"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <svg class="mr-2 -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Class
                    </button>
                </div>

                <div class="relative mb-4">
                    <input type="text" id="${this.getId("search-input")}"
                        placeholder="Search classes..."
                        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div id="${this.getId("classes-container")}" class="space-y-2 max-h-[500px] overflow-y-auto">
                    ${this.renderClassesList()}
                </div>
            </div>
        `;
    }

    async bindEvents() {
        if (this.options.disabled) return;

        // New class button
        const newClassBtn = document.getElementById(
            this.getId("new-class-btn"),
        );
        if (newClassBtn) {
            newClassBtn.addEventListener("click", () => {
                this.notifyChange("class:new");
            });
        }

        const searchInput = document.getElementById(this.getId("search-input"));
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.filterClasses(e.target.value);
            });
        }

        const classesContainer = document.getElementById(
            this.getId("classes-container"),
        );
        if (classesContainer) {
            classesContainer.addEventListener("click", (e) => {
                const classItem = e.target.closest(".class-item");
                if (classItem) {
                    const classId = classItem.dataset.classId;
                    const className =
                        classItem.querySelector(".class-name")?.textContent ||
                        `Class #${classId}`;
                    this.selectClass(classId, className);
                }
            });
        }
    }

    async loadClasses() {
        if (!this.options.programId) return;

        try {
            const classes = await Class.getByProgram(this.options.programId);

            for (const cls of classes) {
                cls.modalities = await this.getClassModalities(cls.id);
            }

            this.options.classes = classes;
            this.filteredClasses = [...classes];

            if (this.initialized) {
                this.updateClassesList();
            }
        } catch (error) {
            Toast.error("Failed to load classes", error);
            this.options.classes = [];
            this.filteredClasses = [];
        }
    }

    async getClassModalities(classId) {
        try {
            return await new Class({ id: classId }).getModalities();
        } catch (error) {
            console.error(
                `Failed to load modalities for class ${classId}:`,
                error,
            );
            return [];
        }
    }

    selectClass(classId, className) {
        const classItems = this.container.querySelectorAll(".class-item");
        classItems.forEach((item) => {
            if (item.dataset.classId === classId) {
                item.classList.add("bg-indigo-50", "border-indigo-300");
            } else {
                item.classList.remove("bg-indigo-50", "border-indigo-300");
            }
        });

        this.notifyChange("class:selected", {
            id: classId,
            name: className,
        });
    }

    filterClasses(searchTerm) {
        searchTerm = searchTerm.toLowerCase();

        if (!searchTerm) {
            this.filteredClasses = [...this.options.classes];
        } else {
            this.filteredClasses = this.options.classes.filter((cls) => {
                const name = cls.name?.toLowerCase() || "";
                const modalityMatch = cls.modalities?.some((m) =>
                    m.modality?.toLowerCase().includes(searchTerm),
                );

                return name.includes(searchTerm) || modalityMatch;
            });
        }

        this.updateClassesList();
    }

    updateClassesList() {
        const container = document.getElementById(
            this.getId("classes-container"),
        );
        if (container) {
            container.innerHTML = this.renderClassesList();
        }
    }

    renderClassesList() {
        if (!this.filteredClasses || this.filteredClasses.length === 0) {
            return `
                <div class="text-center text-gray-500 py-4">
                    No classes found for this program
                </div>
            `;
        }

        return this.filteredClasses
            .map((cls) => this.renderClassItem(cls))
            .join("");
    }

    renderClassItem(cls) {
        const modalitiesText =
            cls.modalities?.length > 0
                ? cls.modalities.map((m) => m.modality).join(", ")
                : "No modalities";

        return `
            <div class="class-item cursor-pointer border rounded-md p-3 hover:bg-gray-50 transition-colors"
                data-class-id="${cls.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-sm font-medium class-name">${cls.name || `Class #${cls.id}`}</h3>
                        <p class="text-xs text-gray-500 mt-1">
                            ${modalitiesText}
                        </p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full bg-gray-100">
                        ${this.getGroupsCount(cls)} groups
                    </span>
                </div>
            </div>
        `;
    }

    getGroupsCount(cls) {
        return cls.groupCount || 0;
    }

    async refreshClasses() {
        await this.loadClasses();
    }
}
