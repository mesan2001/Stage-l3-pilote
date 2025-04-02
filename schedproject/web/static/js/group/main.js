import { GroupManager } from "./subcomponents/GroupManager.js";
import { initializeModels } from "../models/AbstractModel.js";
import { Program } from "../models/Program.js";
import { Group } from "../models/Group.js";
import { Student } from "../models/Student.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initializeModels([Program, Group, Student]);

        const groupManager = new GroupManager(
            document.getElementById("group-management"),
        );
        await groupManager.init();
    } catch (error) {
        console.error("Failed to initialize group management:", error);
    }
});
