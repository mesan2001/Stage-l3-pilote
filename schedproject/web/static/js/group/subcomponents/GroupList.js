import { BaseComponent } from "../../components/BaseComponent.js";
import { Toast } from "../../components/Toast.js";
import { GroupItem } from "./GroupItem.js";

export class GroupList extends BaseComponent {
    getDefaultOptions() {
        return {
            groups: [],
            program: null,
            expandedGroups: {},
        };
    }

    async beforeRender() {
        this.groupComponents = [];
    }

    async render() {
        if (!this.options.program) {
            this.container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    Select a program to manage groups
                </div>
            `;
            return;
        }

        if (this.options.groups.length === 0) {
            this.container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    No groups available. Use "Recompute Groups" to generate groups.
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div id="${this.getId("groups-container")}" class="space-y-4">
                <!-- Group items will be rendered here -->
            </div>
        `;

        await this.renderGroups();
    }

    async renderGroups() {
        const groupsContainer = document.getElementById(
            this.getId("groups-container"),
        );
        if (!groupsContainer) return;

        groupsContainer.innerHTML = "";
        this.groupComponents = [];

        for (const group of this.options.groups) {
            const groupContainer = document.createElement("div");
            groupContainer.id = this.getId(`group-${group.id}`);
            groupContainer.className = "group-container";
            groupsContainer.appendChild(groupContainer);
            const groupComponent = new GroupItem(groupContainer, {
                group: group,
                program: this.options.program,
                expanded: !!this.options.expandedGroups[group.id],
                availableGroups: this.options.groups.map((g) => ({
                    id: g.id,
                    name: g.name,
                })),
            });

            await groupComponent.init();
            this.groupComponents.push(groupComponent);
        }
    }

    async bindEvents() {
        document.addEventListener("group:toggle", (e) => {
            const { groupId, expanded } = e.detail.data;
            this.options.expandedGroups[groupId] = expanded;
        });
    }

    async setOptions(newOptions) {
        const expandedGroups = { ...this.options.expandedGroups };

        super.setOptions(newOptions);

        if (!newOptions.expandedGroups) {
            this.options.expandedGroups = expandedGroups;
        }

        if (this.initialized) {
            await this.render();
            await this.bindEvents();
        }
    }
}
