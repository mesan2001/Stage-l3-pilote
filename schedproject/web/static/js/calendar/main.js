import { CalendarManager } from "./subcomponents/CalendarManager.js";
import { initializeModels } from "../models/AbstractModel.js";
import { Calendar } from "../models/Calendar.js";
import { Period } from "../models/Period.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeModels([Calendar, Period]);

    const container = document.getElementById("calendar-container");
    const calendarManager = new CalendarManager(container);
    calendarManager.init();
});
