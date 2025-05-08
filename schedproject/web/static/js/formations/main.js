import { FormationManager } from "./subcomponents/FormationManager.js";
import { initializeModels } from "../models/AbstractModel.js";
import { Formation } from "../models/Formation.js";
import { Step } from "../models/Step.js";
import { Course } from "../models/Course.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeModels([Formation, Step, Course]);

    const container = document.getElementById("formation-container");
    const formationManager = new FormationManager(container);
    formationManager.init();
});
