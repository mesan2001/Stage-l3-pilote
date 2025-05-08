import { initializeModels } from "../models/AbstractModel.js";
import { Program } from "../models/Program.js";
import { ClassSectioningManager } from "./subcomponents/ClassSectioningManager.js";
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initializeModels([Program]);

        const sectioningManager = new ClassSectioningManager(
            document.getElementById("classes-sectioning-container"),
        );
        await sectioningManager.init();
    } catch (error) {
        console.error("Failed to initialize group management:", error);
    }
});
