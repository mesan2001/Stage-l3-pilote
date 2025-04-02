import { RuleEditorComponent } from "./subcomponents/RuleEditorComponent.js";
import { initializeModels } from "../models/AbstractModel.js";
import { Rule } from "../models/Rule.js";
import { Filter } from "../models/Rule.js";
import { Selector } from "../models/Rule.js";

document.addEventListener("DOMContentLoaded", async () => {
    await initializeModels([Rule, Filter, Selector]);
    const re = new RuleEditorComponent(document.getElementById("rule-editor"));
    re.init();
});
