import { LecturerAssignmentManager } from "./subcomponents/LecturerAssignmentsManager.js";
import { initializeModels } from "../models/AbstractModel.js";
import { Lecturer } from "../models/Lecturer.js";
import { Program } from "../models/Program.js";
import { Course } from "../models/Course.js";
import { Modality } from "../models/Modality.js";
import { LecturerAssignment } from "../models/LecturerAssignment.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeModels([
        Lecturer,
        Program,
        Course,
        Modality,
        LecturerAssignment,
    ]);
    console.log(LecturerAssignment.details());
    const manager = new LecturerAssignmentManager(
        document.getElementById("lecturer-assignments"),
    );
    await manager.init();
});
