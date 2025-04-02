import { ProgramManager } from "./subcomponents/ProgramManager.js";
import { initializeModels } from "../models/AbstractModel.js";
import { Program } from "../models/Program.js";
import { Calendar } from "../models/Calendar.js";
import { Step } from "../models/Step.js";
import { Period } from "../models/Period.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeModels([Program, Step, Calendar, Period]);
    const pm = new ProgramManager(document.getElementById("program-manager"));
    pm.init();
});
