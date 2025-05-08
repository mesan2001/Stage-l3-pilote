import { BaseComponent } from "../../../components/BaseComponent.js";
import { Toast } from "../../../components/Toast.js";

export class ConstraintLoaderComponent extends BaseComponent {
    getDefaultOptions() {
        return {
            constraintData: null,
        };
    }

    async beforeRender() {
        this.constraintRegistry = {};
        this.currentConstraint = null;
        this.currentConstraintType = null;
        this.constraintData = this.options.constraintData || null;

        // Initialize constraint registry
        await this.initializeConstraintRegistry();

        // Listen for constraint type selection events
        document.addEventListener(
            "constraint:type:selected",
            this.handleConstraintTypeSelected.bind(this),
        );
    }

    async render() {
        this.container.innerHTML = `
            <div class="constraint-loader">
                <div id="${this.getId("constraint-placeholder")}" class="text-gray-500 text-center py-4">
                    Select a constraint type to configure
                </div>
                <div id="${this.getId("constraint-container")}" class="hidden"></div>
            </div>
        `;
    }

    async initializeConstraintRegistry() {
        // Dynamically import constraint components
        try {
            const AdjacentRooms = (
                await import("./components/AdjacentRooms.js")
            ).default;
            const AllowedGrids = (await import("./components/AllowedGrids.js"))
                .default;
            const AllowedRooms = (await import("./components/AllowedRooms.js"))
                .default;
            const AllowedTeachers = (
                await import("./components/AllowedTeachers.js")
            ).default;
            const Compactness = (await import("./components/Compactness.js"))
                .default;
            const DifferentDay = (await import("./components/DifferentDay.js"))
                .default;
            const DifferentDailySlot = (
                await import("./components/DifferentDailySlot.js")
            ).default;

            // Add these additional imports
            const DifferentRooms = (
                await import("./components/DifferentRooms.js")
            ).default;
            const DifferentSlot = (
                await import("./components/DifferentSlot.js")
            ).default;
            const DifferentTeachers = (
                await import("./components/DifferentTeachers.js")
            ).default;
            const DifferentWeek = (
                await import("./components/DifferentWeek.js")
            ).default;
            const DifferentWeekday = (
                await import("./components/DifferentWeekday.js")
            ).default;
            const DifferentWeeklySlot = (
                await import("./components/DifferentWeeklySlot.js")
            ).default;
            const ForbiddenRooms = (
                await import("./components/ForbiddenRooms.js")
            ).default;
            const ForbiddenSlots = (
                await import("./components/ForbiddenSlots.js")
            ).default;
            const ForbiddenTeachers = (
                await import("./components/ForbiddenTeachers.js")
            ).default;
            const MinMaxGap = (await import("./components/MinMaxGap.js"))
                .default;
            const NoOverlap = (await import("./components/NoOverlap.js"))
                .default;
            const Periodic = (await import("./components/Periodic.js")).default;
            const RequiredRooms = (
                await import("./components/RequiredRooms.js")
            ).default;
            const RequiredTeachers = (
                await import("./components/RequiredTeachers.js")
            ).default;
            // const SameDailySlot = (
            //     await import("./components/SameDailySlot.js")
            // ).default;
            // const SameDay = (await import("./components/SameDay.js")).default;
            // const SameRooms = (await import("./components/SameRooms.js"))
            //     .default;
            // const SameSlot = (await import("./components/SameSlot.js")).default;
            // const SameTeachers = (await import("./components/SameTeachers.js"))
            //     .default;
            // const SameWeek = (await import("./components/SameWeek.js")).default;
            // const SameWeekday = (await import("./components/SameWeekday.js"))
            //     .default;
            // const SameWeeklySlot = (
            //     await import("./components/SameWeeklySlot.js")
            // ).default;
            const Sequenced = (await import("./components/Sequenced.js"))
                .default;
            // const SessionWorkload = (
            //     await import("./components/SessionWorkload.js")
            // ).default;

            // Register each constraint type
            this.constraintRegistry = {
                ADJACENT_ROOMS: AdjacentRooms,
                ALLOWED_GRIDS: AllowedGrids,
                ALLOWED_ROOMS: AllowedRooms,
                ALLOWED_TEACHERS: AllowedTeachers,
                COMPACTNESS: Compactness,
                DIFFERENT_DAY: DifferentDay,
                DIFFERENT_DAILY_SLOT: DifferentDailySlot,

                // Add these registrations
                DIFFERENT_ROOMS: DifferentRooms,
                DIFFERENT_SLOT: DifferentSlot,
                DIFFERENT_TEACHERS: DifferentTeachers,
                DIFFERENT_WEEK: DifferentWeek,
                DIFFERENT_WEEKDAY: DifferentWeekday,
                DIFFERENT_WEEKLY_SLOT: DifferentWeeklySlot,
                FORBIDDEN_ROOMS: ForbiddenRooms,
                FORBIDDEN_SLOTS: ForbiddenSlots,
                FORBIDDEN_TEACHERS: ForbiddenTeachers,
                MINMAXGAP: MinMaxGap,
                NO_OVERLAP: NoOverlap,
                PERIODIC: Periodic,
                REQUIRED_ROOMS: RequiredRooms,
                REQUIRED_TEACHERS: RequiredTeachers,
                // SAME_DAILY_SLOT: SameDailySlot,
                // SAME_DAY: SameDay,
                // SAME_ROOMS: SameRooms,
                // SAME_SLOT: SameSlot,
                // SAME_TEACHERS: SameTeachers,
                // SAME_WEEK: SameWeek,
                // SAME_WEEKDAY: SameWeekday,
                // SAME_WEEKLY_SLOT: SameWeeklySlot,
                SEQUENCED: Sequenced,
                // SESSION_WORKLOAD: SessionWorkload,
            };
        } catch (error) {
            console.error("Failed to initialize constraint registry:", error);
            Toast.error("Failed to load constraint components");
        }
    }

    handleConstraintTypeSelected(event) {
        const constraintType = event.detail.data;
        this.loadConstraintComponent(constraintType);
    }

    async loadConstraintComponent(constraintType, data = {}) {
        try {
            // Unload current constraint if any
            this.unloadCurrentConstraint();

            if (!constraintType || !this.constraintRegistry[constraintType]) {
                Toast.warning(`Constraint type "${constraintType}" not found`);
                return false;
            }

            const placeholderEl = document.getElementById(
                this.getId("constraint-placeholder"),
            );
            const containerEl = document.getElementById(
                this.getId("constraint-container"),
            );

            if (placeholderEl) placeholderEl.classList.add("hidden");
            if (containerEl) containerEl.classList.remove("hidden");

            // Create container for constraint component
            const constraintContainer = document.createElement("div");
            containerEl.appendChild(constraintContainer);

            // Initialize the constraint component
            const ConstraintClass = this.constraintRegistry[constraintType];
            this.currentConstraint = new ConstraintClass(constraintContainer, {
                data: data,
            });

            // Initialize the component
            await this.currentConstraint.init();

            // Store the type and data
            this.currentConstraintType = constraintType;
            this.constraintData = data;

            // Notify constraint change
            this.notifyChange("constraint:changed", {
                type: constraintType,
                data: this.getCurrentConstraintData(),
            });

            return true;
        } catch (error) {
            console.error("Failed to load constraint component:", error);
            Toast.error("Failed to load constraint component", error);
            return false;
        }
    }

    unloadCurrentConstraint() {
        if (this.currentConstraint) {
            this.currentConstraint.destroy();
            this.currentConstraint = null;
            this.currentConstraintType = null;

            const placeholderEl = document.getElementById(
                this.getId("constraint-placeholder"),
            );
            const containerEl = document.getElementById(
                this.getId("constraint-container"),
            );

            if (placeholderEl) placeholderEl.classList.remove("hidden");
            if (containerEl) {
                containerEl.innerHTML = "";
                containerEl.classList.add("hidden");
            }
        }
    }

    getCurrentConstraintData() {
        if (!this.currentConstraint) return null;

        try {
            return this.currentConstraint.getValue();
        } catch (error) {
            console.error("Failed to get constraint data:", error);
            return null;
        }
    }

    validateConstraint() {
        if (!this.currentConstraint) return false;

        try {
            return this.currentConstraint.validate();
        } catch (error) {
            console.error("Constraint validation error:", error);
            return false;
        }
    }

    onDestroy() {
        document.removeEventListener(
            "constraint:type:selected",
            this.handleConstraintTypeSelected,
        );
        this.unloadCurrentConstraint();
    }
}
