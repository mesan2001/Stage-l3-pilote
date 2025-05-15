
// variblable globale pour stocker les données de l'université
// périmètre recuu de l'API
let universityData = null;

async function initUIWithData(data) {
  try {
    universityData = data;
    handleApiData(data);
    console.log("Données chargées avec succès !");

    // l'onglet des règles
    const rulesTab = document.getElementById("rules-tab");
    if (rulesTab) {
      const tabTrigger = new bootstrap.Tab(rulesTab);
      tabTrigger.show();
    }
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur lors du chargement des données");
  }
}

// Au chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
  prepareEventListeners();
});

async function prepareEventListeners() {
  initializeRulesState();
  
  // Désactiver le bouton au chargement initial
  document.getElementById("search-button").disabled = true;
  try {
    await fetchFormations();
    
    transformSelectWithSearch();
  } catch (error) {
    console.error("Erreur lors du chargement des formations:", error);
  }
}

/* Gestion de la complétion des textes et le chargement des formations depuis l'API*/

const apiBaseUrl = "http://localhost:8080/api";
const instanceSelect = document.getElementById("instance-type-filter");
const periodContainer = document.getElementById("period-container");
const periodSelect = document.getElementById("period-select");
const selectAllButton = document.getElementById("select-all");

let formationsList = [];

// Fonction pour récupérer les formations depuis l'API
// On va faire une requete sur l'endpoint /api/formations/
// et on va remplir le select avec les formations
async function fetchFormations() {
  try {
    const response = await fetch(`${apiBaseUrl}/formations/`);
    if (!response.ok) throw new Error("Erreur lors de la récupération des formations");

    const formations = await response.json();
    formationsList = formations;

    // Ajout dynamique des formations au <select>
    instanceSelect.innerHTML = `
      <option value="all">Sélectionner une formation...</option>
      ${formations.map(formation => `
        <option value="${formation.id}">${formation.name}</option>
      `).join('')}
    `;
    
  } catch (error) {
    console.error("Erreur :", error);
  }
}

// Transforme le select en select avec recherche intégrée
function transformSelectWithSearch() {
  const selectContainer = document.createElement('div');
  selectContainer.className = 'select-with-search-container';
  selectContainer.style.position = 'relative';
  
  // Crée le bouton d'affichage du select
  const selectButton = document.createElement('button');
  selectButton.className = 'form-select text-start';
  selectButton.textContent = 'Sélectionner une formation...';
  selectButton.style.cursor = 'pointer';
  
  // le dropdown (qui contiendra la recherche et les options)
  const dropdown = document.createElement('div');
  dropdown.className = 'select-dropdown bg-white border rounded mt-1 p-2';
  dropdown.style.position = 'absolute';
  dropdown.style.width = '95%';
  dropdown.style.zIndex = '1000';
  dropdown.style.display = 'none';
  dropdown.style.maxHeight = '120px';
  dropdown.style.overflowY = 'auto';
  
  //  le champ de recherche
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Rechercher...';
  searchInput.className = 'form-control form-control-sm mb-2';
  
  // liste des options
  const optionsList = document.createElement('div');
  optionsList.className = 'options-list';
  
  //  les options initiales
  updateOptionsList(optionsList, '');
  
  dropdown.appendChild(searchInput);
  dropdown.appendChild(optionsList);
  selectContainer.appendChild(selectButton);
  selectContainer.appendChild(dropdown);
  
  instanceSelect.parentNode.insertBefore(selectContainer, instanceSelect);
  instanceSelect.style.display = 'none';
  
  selectButton.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  searchInput.addEventListener('input', function() {
    updateOptionsList(optionsList, this.value);
  });
  
  //  le dropdown quand on clique ailleurs
  document.addEventListener('click', function() {
    dropdown.style.display = 'none';
  });
  
  // Empêche la fermeture quand on clique dans le dropdown
  dropdown.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

// Met à jour la liste des options filtrées
function updateOptionsList(container, filter) {
  const filterLower = filter.toLowerCase();
  const options = Array.from(instanceSelect.options)
    .filter(option => option.value === 'all' || 
           option.textContent.toLowerCase().includes(filterLower));
  
  container.innerHTML = '';
  
  if (options.length === 0) {
    container.innerHTML = '<div class="text-muted p-2">Aucun résultat</div>';
    return;
  }
  
  options.forEach(option => {
    const optionElement = document.createElement('div');
    optionElement.className = 'select-option p-2';
    optionElement.textContent = option.textContent;
    optionElement.style.cursor = 'pointer';
    
    optionElement.addEventListener('click', function() {
      instanceSelect.value = option.value;
      document.querySelector('.select-with-search-container button').textContent = option.textContent;
      
      if (option.value !== 'all') {
        fetchPeriods(option.value);
      } else {
        periodContainer.style.display = 'none';
      }
      
      document.querySelector('.select-dropdown').style.display = 'none';
    });
    
    container.appendChild(optionElement);
  });
}

async function fetchPeriods(formationId) {
  try {
    const response = await fetch(`${apiBaseUrl}/steps/formation/${formationId}`);
    if (!response.ok) throw new Error("Erreur lors de la récupération des périodes");

    const steps = await response.json();
    const periods = steps
      .filter((step) => step.periodcode !== "None")
      .map((step) => ({
        id: step.id,
        code: step.periodcode,
      }));

    updatePeriods(periods);
  } catch (error) {
    console.error("Erreur :", error);
  }
}

function updatePeriods(periods) {
  periodSelect.innerHTML = "";

  if (periods.length > 0) {
    periodContainer.style.display = "block";
    periods.forEach((period) => {
      let option = document.createElement("option");
      option.value = period.id;
      option.textContent = period.code;
      periodSelect.appendChild(option);
    });
  } else {
    periodContainer.style.display = "none";
  }
}

selectAllButton.addEventListener("click", function() {
  for (let option of periodSelect.options) {
    option.selected = true;
  }
  document.getElementById("confirmation-container").style.display = "inline-block";
});



// PARTIE 2 : VISUALISATION DE LA/LES FORMATION.S SELECTIONNÉE
/* Gestion des sélections de formations et périodes */

let allSelections = []; // Stocke toutes les sélections {formation, periods}

// Affiche le bouton de confirmation si au moins une période est sélectionnée
document
  .getElementById("period-select")
  .addEventListener("change", function () {
    const hasSelection = this.selectedOptions.length > 0;
    document.getElementById("confirmation-container").style.display =
      hasSelection ? "inline-block" : "none";
});

// Confirmation de la sélection
document
  .getElementById("confirm-selection")
  .addEventListener("click", function () {
    const formationId = document.getElementById("instance-type-filter").value;
    const formation = formationsList.find((f) => f.id == formationId) || {
      id: formationId,
      name: "Formation inconnue",
    };
    const periods = Array.from(
      document.getElementById("period-select").selectedOptions
    ).map((option) => ({
      id: option.value, // L'ID de la période
      code: option.text, // Le code (P1, P2, etc...)
    }));

    const isEdit = this.hasAttribute("data-edit-index");

    if (isEdit) {
      // Modification d'une sélection existante
      const index = parseInt(this.getAttribute("data-edit-index"));
      allSelections[index] = { formation, periods };
      this.removeAttribute("data-edit-index");
    } else {
      // Nouvelle sélection
      allSelections.push({ formation, periods });
    }
    //console.log("test :", JSON.stringify(allSelections, null, 2));
    updateSummaryDisplay();
    resetSelectionInterface();
});

/* desactiver le bouton "lancer la recherche  ( si aucune période n'a été selectionnée ) */
function checkSelections() {
  const searchButton = document.getElementById("search-button");
  if (allSelections.length > 0) {
    searchButton.disabled = false;
  } else {
    searchButton.disabled = true;
    document.getElementById("summary-container").style.display = "none";
  }
}

/*
// Gestion STRICTE du bouton "Suivant" vers filtering-tab
// On ne peut pas naviguer vers le tab filtering si on n'a pas chargé le périmètre
// et si on n'a pas sélectionné de périodes
// On utilise la phase de capture pour s'assurer que cet événement est traité en premier
*/
document.getElementById('filtering-next-btn')?.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopImmediatePropagation();

  if (!universityData) {
    alert("Action bloquée : Vous devez d'abord chaarger le périmètre.");
    return;
  }

  // 3. Navigation MANUELLE seulement si les données sont prêtes
  const nextTab = document.getElementById(this.dataset.next);
  if (nextTab) {
    new bootstrap.Tab(nextTab).show();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}, true);




// Mise à jour de l'affichage du résumé
function updateSummaryDisplay() {
  const summaryContainer = document.getElementById("summary-container");
  const itemsContainer =
    document.getElementById("selection-items-container") ||
    (() => {
      const div = document.createElement("div");
      div.id = "selection-items-container";
      summaryContainer.appendChild(div);
      return div;
    })();

  // Liste complète des sélections
  itemsContainer.innerHTML = allSelections
    .map(
      (selection, index) => `
    <div class="selection-item mb-3 p-2 border rounded">
        <div><strong>Formation :</strong> ${selection.formation.name}</div>
        <div><strong>Périodes :</strong> ${selection.periods
          .map((p) => p.code)
          .join(", ")}</div>
        <div class="mt-2">
            <button class="btn btn-sm btn-warning me-2 edit-selection" data-index="${index}">Modifier</button>
            <button class="btn btn-sm btn-danger remove-selection" data-index="${index}">Supprimer</button>
        </div>
    </div>
    `
    )
    .join("");

  // Gestion des événements
  document.querySelectorAll(".remove-selection").forEach((btn) => {
    btn.addEventListener("click", function () {
      allSelections.splice(parseInt(this.dataset.index), 1);
      updateSummaryDisplay();
      checkSelections();
    });
  });

  document.querySelectorAll(".edit-selection").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = parseInt(this.dataset.index);
      const { formation, periods } = allSelections[index];

      document.getElementById("instance-type-filter").value = formation.id;
      fetchPeriods(formation.id).then(() => {
        const periodSelect = document.getElementById("period-select");
        Array.from(periodSelect.options).forEach((opt) => {
          opt.selected = periods.includes(opt.text);
        });

        document
          .getElementById("confirm-selection")
          .setAttribute("data-edit-index", index);
        document.getElementById("period-container").style.display = "block";
        document.getElementById("confirmation-container").style.display =
          "inline-block";
        document.getElementById("summary-container").style.display = "none";
      });
    });
  });

  summaryContainer.style.display = "block";
  checkSelections();
}

// Réinitialisation de l'interface
function resetSelectionInterface() {
  document.getElementById("instance-type-filter").value = "all";
  document.getElementById("period-select").innerHTML = "";
  document.getElementById("period-container").style.display = "none";
  document.getElementById("confirmation-container").style.display = "none";
}

// Bouton "Modifier la sélection"
document
  .getElementById("edit-selection")
  ?.addEventListener("click", function () {
    document.getElementById("period-container").style.display = "block";
    document.getElementById("summary-container").style.display = "none";
    resetSelectionInterface();
  });

  
//                 LES DATA DU PÉRIMETRE :
// 1.  universityData une variable globale qui contient les données du périmetres initialisé à nul au debut

async function fetchPerimetersData() {
  try {
    // 1. Extraire tous les IDs de périodes
    // la variables allSelections est un tableau qui contient toutes les périodes séléctionnée classé par formation
    // à la fin de cette variable allPeriodIds contient bien toutes les ids des périodes sélectionnées
    const allPeriodIds = allSelections.flatMap((selection) =>
      selection.periods.map((period) => period.id).filter((id) => id)
    ); 

    // 2. Construire l'URL avec les paramètres
    // On va faire une requete sur l'endpoint /api/perimeters/?steps=1&steps=2&steps=3 etc...
    const queryParams = `steps=${allPeriodIds.join(",")}`;
    const url = `${apiBaseUrl}/perimeters/?${queryParams}`;

    // 3. appel API
    const response = await fetch(url);
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des périmètres");

    const perimeters = await response.json();
    console.log("Périmètres récupérés:", perimeters);
    return perimeters;
  } catch (error) {
    console.error("Erreur lors de la récupération des périmètres:", error);
    throw error; // Vous pourriez vouloir gérer cette erreur différemment
  }
}


async function loadDataAndInitUI() {
  try {
    const data = await fetchPerimetersData();
    if (!data || !data.timetabling.rules) {
      throw new Error("Données reçues invalides");
    }

    //  l'interface utilisateur avec les données
    await initUIWithData(data);
  } catch (error) {
    console.error("Erreur:", error);
    alert("Erreur lors du chargement des données");
  }
}


async function handleApiData(apiData) {
  try {
    universityData = apiData;
    renderRulesDetails(universityData);
  } catch (error) {
    console.error("Erreur lors du traitement des données:", error);
  }
}

  // génération du  XML
  async function generateCompleteTimetabling() {
    if (!universityData || !universityData.timetabling.rules) {
      await loadDataAndInitUI();
    }

    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
    const rootOpen = `<timetabling 
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="usp_timetabling_v0_2.xsd"
      name="${universityData.timetabling.name}"
      nrWeeks="${universityData.timetabling.nrWeeks}"
      nrDaysPerWeek="${universityData.timetabling.nrDaysPerWeek}"
      nrSlotsPerDay="${universityData.timetabling.nrSlotsPerDay}">`;
      const calendarXml = `
      <calendar startingWeek="36" year="2023">
          <!-- -->
          <weeks nr="34" sequence="1,2,4,5,7-3999"/>
          <!-- -->
          <days nr="5" sequence="1,2,3,4,5"/>
          <!-- Correspond à Lundi mardi mercredi jeudi vendredi (format iso dimanche=0 , lundi=1 ,... -->
          <slots nr="1440"/>
      </calendar>`;
    const roomsXml = universityData.timetabling.rooms
    .map((room) => {
      // Échapper les caractères spéciaux XML dans le label
      const escapedLabel = room.label
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      return `        <room id="${room.id}" capacity="${room.capacity}" label="${escapedLabel}" />`;
    })
    .join("\n");

    const teachersXml = universityData.timetabling.teachers
      .map((teacher) => {
        return `        <teacher  label="${teacher.label}" id="${teacher.id}" />`;
      })
      .join("\n");
    // coursesXml
    const coursesXml = universityData.timetabling.courses
      .map((course) => {
        const partsXml = course.parts
          .map((part) => {
            const classesXml = part.classes.items
              .map(
                (cls) =>
                  `                <class id="${cls.id}" ${
                    cls.label ? `label="${cls.label}"` : ""
                  } />`
              )
              .join("\n");

            const allowedRoomsXml = part.allowedRooms.rooms
              .map((room) => `                <room refId="${room}" />`)
              .join("\n");

            const allowedTeachersXml = part.allowedTeachers.teachers
              .map(
                (teacher) =>
                  `                <teacher refId="${teacher.id}" nrSessions="${teacher.nrSessions}" />`
              )
              .join("\n");

            return `
              <part id="${part.id}" nrSessions="${part.nrSessions}" label="${part.label}">
                  <classes maxHeadCount="${part.classes.maxHeadCount}">
      ${classesXml}
                  </classes>
                  <allowedSlots sessionLength="${part.allowedSlots.sessionLength}">
                      <dailySlots>${part.allowedSlots.dailySlots}</dailySlots>
                      <days>${part.allowedSlots.days}</days>
                      <weeks>${part.allowedSlots.weeks}</weeks>
                  </allowedSlots>
                  <allowedRooms sessionRooms="${part.allowedRooms.sessionRooms}">
      ${allowedRoomsXml}
                  </allowedRooms>
                  <allowedTeachers sessionTeachers="${part.allowedTeachers.sessionTeachers}">
      ${allowedTeachersXml}
                  </allowedTeachers>
              </part>`;
          })
          .join("\n");

        return `
          <course id="${course.id}" label="${course.label}">
      ${partsXml}
          </course>`;
      })
      .join("\n");

    
    // studentsXml
    const studentsXml = universityData.timetabling.students.map(student => {
          const coursesXml = student.courses.map(courseId => 
              `        <course refId="${courseId}" />`
          ).join("\n");
      
          return `
          <student id="${student.id}" label="${student.label}">
              <courses>
      ${coursesXml}
              </courses>
          </student>`;
      }).join("\n");

    // rulesXmt
    const rulesXml = universityData.timetabling.rules
      .map((rule) => {
        const selectorsXml = rule.selector
          .map(
            (sel) =>
              `        <selector generator="${sel.generator}" filters="${sel.filter}" />`
          )
          .join("\n");

        const parametersXml = rule.constraint.parameters
          ? rule.constraint.parameters
              .map(
                (paramGroup) =>
                  `            <parameters>
      ${paramGroup
        .map((param) =>
          param.value
            ? `                <parameter name="${param.type}">${param.value}</parameter>`
            : `                <parameter name="${param.type}"/>`
        )
        .join("\n")}
                  </parameters>`
              )
              .join("\n")
          : "";

        const constraintContent = parametersXml
          ? `>
      ${parametersXml}
              </constraint>`
          : "/>";

        return `
          <rule>
      ${selectorsXml}
              <constraint name="${rule.constraint.name}" type="${rule.constraint.type}"${constraintContent}
          </rule>`;
      })
      .join("\n");

      // solution
      const solutionXml = universityData.timetabling.solution.groups
    .map(group => {
      // Génération des étudiants
      const studentsXml = group.students
        .map(studentId => `                <student refId="student-${studentId}" />`)
        .join("\n");
      
      // Génération des classes (si elles existent dans le groupe)
      const classesXml = group.classes
        ? group.classes
            .map(classId => `                <class refId="${classId}" />`)
            .join("\n")
        : "";
      
      return `
              <group id="${group.id}" headCount="${group.headcount}">
                  <students>
  ${studentsXml}
                  </students>
                  ${group.classes ? `
                  <classes>
  ${classesXml}
                  </classes>` : ''}
              </group>`;
    })
    .join("\n");

    const rootClose = `</timetabling>`;

    return `
    ${xmlHeader}
    ${rootOpen}
    ${calendarXml}
        <rooms>
    ${roomsXml}
        </rooms>
        <teachers>
    ${teachersXml}
        </teachers>
        <courses>
    ${coursesXml}
        </courses>
        <students>
    ${studentsXml}
        </students>
        <rules>
    ${rulesXml}
        </rules>
        <solution>
            <groups>
    ${solutionXml}
            </groups>
        </solution>
    ${rootClose}`.trim();
  }

// téléchargement XML du fichier
function downloadXML(xmlContent) {
  const blob = new Blob([xmlContent], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "emploi_du_temps.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// télécharger JSON du fichier 
function downloadJSON(jsonData) {
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "emploi_du_temps.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


  //  les données générées pour les téléchargements
let generatedData = {
  xml: null,
  json: null
};

document.getElementById("search-button").addEventListener("click", async function () {
  try {
    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Génération...';
    
    
    await loadDataAndInitUI();
    
    // Vérifier si les données sont prêtes
    // Si les données ne sont pas prêtes, on les charge    
    generatedData.xml = await generateCompleteTimetabling();
    generatedData.json = universityData; 
    
    // Active le bouton de téléchargement
    downloadBtn.disabled = false;
    downloadBtn.textContent = "Visualiser";
    
  } catch (error) {
    console.error("Erreur:", error);
    document.getElementById("download-btn").textContent = "Erreur";
  }
});

// Gestionnaire pour le téléchargement XML
document.getElementById("download-xml").addEventListener("click", function(e) {
  e.preventDefault();
  if (generatedData.xml) {
    downloadXML(generatedData.xml);
  } else {
    alert("Aucune donnée XML à télécharger. Veuillez d'abord lancer la recherche.");
  }
});

// Gestionnaire pour le téléchargement JSON
document.getElementById("download-json").addEventListener("click", function(e) {
  e.preventDefault();
  if (generatedData.json) {
    downloadJSON(generatedData.json);
  } else {
    alert("Aucune donnée JSON à télécharger. Veuillez d'abord lancer la recherche.");
  }
});

/* PARCOURS DES REGLES ET FILTRAGE */

// Initialise l'état des règles au chargement de la page
function initializeRulesState() {
  // définir toutes les cases à cocher comme cochées
  document.querySelectorAll(".rule-checkbox").forEach((checkbox) => {
    checkbox.checked = true;
    // Mettre à jour le badge de statut 
    const row = checkbox.closest("tr");
    if (row) {
      const badge = row.querySelector(".badge");
      if (badge) {
        badge.className = "badge bg-success";
        badge.textContent = "Actif";
      }
    }
  });

  // Cocher la case "tout sélectionner"
  const selectAllCheckbox = document.getElementById(
    "select-all-rules-checkbox"
  );
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = true;
  }

  // Mise à jour le compteur de règles actives
  const totalRules = document.querySelectorAll(".rule-checkbox").length;
  const activeRulesCount = document.getElementById("active-rules-count");
  const totalRulesCount = document.getElementById("total-rules-count");
  if (activeRulesCount) activeRulesCount.textContent = totalRules;
  if (totalRulesCount) totalRulesCount.textContent = totalRules;

  // Vide le champ de saisie manuelle
  const manualInput = document.getElementById("deactivate-rules");
  if (manualInput) {
    manualInput.value = "";
  }
}


const selectedRuleIds = new Set(); // id des regles sélectionnées

// Initialiser le tri des colonnes
function initSorting() {
  const table = document.getElementById("rules-table");
  if (!table) return;

  const sortableHeaders = table.querySelectorAll(".sortable");
  let currentSortColumn = null;
  let currentSortDirection = null;

  sortableHeaders.forEach((header) => {
    header.addEventListener("click", function () {
      const sortField = this.getAttribute("data-sort");

      //si on clique sur la même colonne, on inverse la direction
      if (currentSortColumn === sortField) {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        currentSortDirection = "asc";
        currentSortColumn = sortField;
      }

      // les classes de tri pour tous les en-têtes
      sortableHeaders.forEach((th) => {
        th.classList.remove("asc", "desc");
      });

      //  la classe de direction appropriée à l'en-tête actuel
      this.classList.add(currentSortDirection);

      //  le tri
      sortRulesTable(sortField, currentSortDirection);
    });
  });
}

// pour trier le tableau des règles
function sortRulesTable(field, direction) {
  const tbody = document.querySelector("#rules-list");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));

  //l'ordre initial pour conserver l'ordre en cas d'égalité
  const originalOrder = rows.map((row, index) => ({ row, index }));

  rows.sort((a, b) => {
    let valueA, valueB;

    // fonction helper pour extraire les valeurs numériques
    const extractNumber = (str) => {
      if (!str) return 0;
      const num = parseFloat(str.replace(/[^\d.-]/g, ""));
      return isNaN(num) ? 0 : num;
    };

    // déterminer quelle colonne utiliser pour le tri
    switch (field) {
      case "id":
        valueA = extractNumber(a.children[1].textContent);
        valueB = extractNumber(b.children[1].textContent);
        break;
      case "label":
        valueA = a.children[2].textContent.trim().toLowerCase();
        valueB = b.children[2].textContent.trim().toLowerCase();
        break;
      case "generator":
        valueA = a.children[3].textContent.trim().toLowerCase();
        valueB = b.children[3].textContent.trim().toLowerCase();
        break;
      case "filter":
        valueA = a.children[4].textContent.trim().toLowerCase();
        valueB = b.children[4].textContent.trim().toLowerCase();
        break;
      case "constraint":
        valueA = a.children[5].textContent.trim().toLowerCase();
        valueB = b.children[5].textContent.trim().toLowerCase();
        break;
      case "type":
        valueA = a.children[6].textContent.trim().toLowerCase();
        valueB = b.children[6].textContent.trim().toLowerCase();
        break;
      case "status":
        valueA = a.querySelector(".badge").textContent.trim().toLowerCase();
        valueB = b.querySelector(".badge").textContent.trim().toLowerCase();
        break;
      default:
        valueA = a.children[1].textContent.trim().toLowerCase();
        valueB = b.children[1].textContent.trim().toLowerCase();
    }

    // comparaison en tenant compte du type de données
    if (typeof valueA === "number" && typeof valueB === "number") {
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    } else {
      if (valueA < valueB) return direction === "asc" ? -1 : 1;
      if (valueA > valueB) return direction === "asc" ? 1 : -1;
      // En cas d'égalité, on maintient l'ordre original
      return (
        originalOrder.find((item) => item.row === a).index -
        originalOrder.find((item) => item.row === b).index
      );
    }
  });

  // réorganiser les lignes dans le tableau
  rows.forEach((row) => tbody.appendChild(row));
}

// data = universityData
// data.timetabling.rules = les regles
// data.timetabling.rules[0].selector = le générateur de la règle
function renderRulesDetails(data) {
  if (!data || !data.timetabling.rules) {
    console.error("Données invalides pour le rendu des règles");
    return;
  }

  const tableBody = document.getElementById("rules-list");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  const totalRules = data.timetabling.rules.length;

  // Initialiser selectedRuleIds avec toutes les règles au début
  selectedRuleIds.clear();
  data.timetabling.rules.forEach((rule, index) => {
    selectedRuleIds.add(index + 1);
  });

  // Mettre à jour le compteur initial
  const activeRulesCount = document.getElementById("active-rules-count");
  const totalRulesCount = document.getElementById("total-rules-count");
  if (activeRulesCount && totalRulesCount) {
    activeRulesCount.textContent = totalRules;
    totalRulesCount.textContent = totalRules;
  }

  data.timetabling.rules.forEach((rule, index) => {
    const row = document.createElement("tr");
    row.dataset.ruleId = index + 1;

    let generatorDisplay = "";
    let filterDisplay = "";

    if (rule.selector && Array.isArray(rule.selector) && rule.selector[0]) {
      generatorDisplay = rule.selector[0].generator || "";
      filterDisplay = rule.selector[0].filters || rule.selector[0].filter || "";
    }

    row.innerHTML = `
          <td>
              <input type="checkbox" class="rule-checkbox" data-rule-id="${
                index + 1
              }" checked>
          </td>
          <td>${index + 1}</td>
          <td>${rule.labels || ""}</td>  
          <td>${generatorDisplay}</td>
          <td>${filterDisplay}</td>
          <td>${rule.constraint?.name || ""}</td>
          <td>${rule.constraint?.type || "hard"}</td>
          <td>
              <span class="badge bg-success">Actif</span>
          </td>
      `;

    // écouteurs 
    const checkbox = row.querySelector(".rule-checkbox");
    const badge = row.querySelector(".badge");

    checkbox.addEventListener("change", function () {
      const ruleId = parseInt(this.dataset.ruleId);
      const row = this.closest("tr");
      const activeRulesCount = document.getElementById("active-rules-count");

      if (this.checked) {
        badge.className = "badge bg-success";
        badge.textContent = "Actif";
        row.classList.remove("inactive");
        selectedRuleIds.add(ruleId);
        removeFromManualInput(ruleId);
        
      } else {
        badge.className = "badge bg-danger";
        badge.textContent = "Inactif";
        row.classList.add("inactive");
        selectedRuleIds.delete(ruleId);
        addToManualInput(ruleId);
      }

      // Mettre à jour le compteur avec le nombre actuel de règles actives
      if (activeRulesCount) {
        activeRulesCount.textContent = selectedRuleIds.size;
      }
    });

    tableBody.appendChild(row);
  });

  // initialiser le tri après avoir rempli le tableau
  initSorting();
}




// fonction pour ajouter une règle à la saisie manuelle
function addToManualInput(ruleId) {
  const manualInput = document.getElementById("deactivate-rules");
  if (!manualInput) return;

  let currentRules = manualInput.value
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r);
  if (!currentRules.includes(ruleId)) {
    currentRules.push(ruleId);
    currentRules.sort((a, b) => parseInt(a) - parseInt(b));
    manualInput.value = currentRules.join(", ");
  }
}

// fonction pour retirer une règle de la saisie manuelle
function removeFromManualInput(ruleId) {
  const manualInput = document.getElementById("deactivate-rules");
  if (!manualInput) return;

  // Convertir ruleId en string pour la comparaison (car split retourne des strings)
  const ruleIdStr = String(ruleId);

  let currentRules = manualInput.value
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r);

  currentRules = currentRules.filter((r) => r !== ruleIdStr);
  manualInput.value = currentRules.join(", ");
}


//  fonction pour mettre à jour le compteur de règles
function updateRulesCounter(activeCount, totalCount) {
  const activeRulesCount = document.getElementById("active-rules-count");
  const totalRulesCount = document.getElementById("total-rules-count");

  if (activeRulesCount && totalRulesCount) {
    activeRulesCount.textContent = activeCount;
    totalRulesCount.textContent = totalCount;
  }
}

// changement de l'état de la case à cocher "Tout sélectionner"
document.getElementById("select-all-rules-checkbox")?.addEventListener("change", function () {
  const checkboxes = document.querySelectorAll(".rule-checkbox");
  const totalRules = checkboxes.length;
  const isChecked = this.checked;

  checkboxes.forEach((checkbox) => {
    checkbox.checked = isChecked;
    checkbox.dispatchEvent(new Event("change")); 
  });

  // Mise  à jour du compteur selon le cas
  const selectedCount = isChecked ? totalRules : 0;
  updateRulesCounter(selectedCount, totalRules);
});

// Recherche dans la liste des règles
document.getElementById("rules-search")?.addEventListener("input", function () {
  const searchTerm = this.value.toLowerCase();
  const rows = document.querySelectorAll("#rules-list tr");

  // Filtrer les lignes selon le terme de recherche
  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
});
 

function parseRuleRanges(input) {
  const rules = new Set();
  const parts = input.split(',').map(part => part.trim()).filter(part => part);

  parts.forEach(part => {
    if (part.includes('-')) {
      // C'est une plage
      const [start, end] = part.split('-').map(num => parseInt(num.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          rules.add(i.toString());
        }
      }
    } else {
      // C'est un ID simple
      if (!isNaN(parseInt(part))) {
        rules.add(part);
      }
    }
  });

  return Array.from(rules);
}

  document
  .getElementById("deactivate-rules")
  ?.addEventListener("input", function () {
    const manualRules = parseRuleRanges(this.value);
    
    let activeCount = 0;
    
    document.querySelectorAll(".rule-checkbox").forEach((checkbox) => {
      const ruleId = checkbox.dataset.ruleId;
      const row = checkbox.closest("tr");
      const badge = row.querySelector(".badge");

      if (manualRules.includes(ruleId)) {
        checkbox.checked = false;
        badge.className = "badge bg-danger";
        badge.textContent = "Inactif";
        selectedRuleIds.delete(parseInt(ruleId));
      } else {
        checkbox.checked = true;
        badge.className = "badge bg-success";
        badge.textContent = "Actif";
        selectedRuleIds.add(parseInt(ruleId));
        activeCount++;
      }
    });

    // Mettre à jour le compteur
    const activeRulesCount = document.getElementById("active-rules-count");
    if (activeRulesCount) {
      activeRulesCount.textContent = selectedRuleIds.size;
    }
    
    // Mettre à jour la case "Tout sélectionner"
    const selectAllCheckbox = document.getElementById("select-all-rules-checkbox");
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = selectedRuleIds.size === document.querySelectorAll(".rule-checkbox").length;
    }
  });


/* === PARTIE FILTRAGE AVANCE === */

// Fonction principale de filtrage
function applyAdvancedFilters() {
  if (!universityData || !universityData.timetabling.rules) {
    alert("Veuillez d'abord charger les données");
    return;
  }
  // Récupère toutes les valeurs des filtres
  const type = document.getElementById("filter-constraint-type").value;
  const customType = document.getElementById(
    "filter-constraint-type-custom"
  ).value;
  const name = document.getElementById("filter-constraint-name").value;
  const customName = document.getElementById(
    "filter-constraint-name-custom"
  ).value;
  const label = document.getElementById("filter-labels").value;
  const customLabel = document.getElementById("filter-labels-custom").value;
  const generator = document.getElementById("filter-generator").value;
  const selector = document.getElementById("filter-selector").value;
  const parameter = document.getElementById("filter-parameter").value;

  const filteredRules = universityData.timetabling.rules.filter((rule) => {
    // Vérifie les champs dans constraint
    const constraint = rule.constraint || {};
    if (type && constraint.type !== type) return false;
    if (
      customType &&
      (!constraint.type || !constraint.type.includes(customType))
    )
      return false;

    if (name && constraint.name !== name) return false;
    if (
      customName &&
      (!constraint.name || !constraint.name.includes(customName))
    )
      return false;

    // Labels
    if (label && (!rule.labels || !rule.labels.includes(label))) return false;
    if (
      customLabel &&
      (!rule.labels || !rule.labels.some((l) => l.includes(customLabel)))
    )
      return false;

    // Generator dans selector (tableau)
    if (
      generator &&
      (!rule.selector ||
        !rule.selector.some(
          (s) => s.generator && s.generator.includes(generator)
        ))
    )
      return false;

    // Filter ou selector complet
    if (
      selector &&
      (!rule.selector ||
        !rule.selector.some((s) => JSON.stringify(s).includes(selector)))
    )
      return false;

    // Parameters dans constraint
    if (
      parameter &&
      (!constraint.parameters ||
        !JSON.stringify(constraint.parameters).includes(parameter))
    )
      return false;

    return true;
  });

  // Affiche les résultats
  renderFilteredResults(filteredRules);
}

// Affiche les résultats filtrés
// filteredRules est un tableau d'objets de règles
// qui correspondent aux critères de filtrage
function renderFilteredResults(filteredRules) {
  const rulesContainer = document.getElementById("rules-list");
  rulesContainer.innerHTML = "";

  if (filteredRules.length === 0) {
    rulesContainer.innerHTML =
      '<div class="alert alert-warning">Aucune règle ne correspond aux critères</div>';
    return;
  }

  const filteredData = {
    timetabling: {
      ...universityData.timetabling,
      rules: filteredRules,
    },
  };

  renderRulesDetails(filteredData);

  // Affiche le nombre de résultats
  const countElement = document.createElement("div");
  countElement.className = "mb-3 text-muted";
  countElement.textContent = `${filteredRules.length} règles trouvées`;
  rulesContainer.prepend(countElement);
}

function resetFilters() {
  // Réinitialise les champs
  document.getElementById("filter-constraint-type").value = "";
  document.getElementById("filter-constraint-type-custom").value = "";
  document.getElementById("filter-constraint-name").value = "";
  document.getElementById("filter-constraint-name-custom").value = "";
  document.getElementById("filter-labels").value = "";
  document.getElementById("filter-labels-custom").value = "";
  document.getElementById("filter-generator").value = "";
  document.getElementById("filter-selector").value = "";
  document.getElementById("filter-parameter").value = "";
  document.getElementById("deactivate-rules").value = "";
  
  renderRulesDetails(universityData);
}

// Écouteurs d'événements
document
  .getElementById("apply-filters")
  .addEventListener("click", applyAdvancedFilters);
document
  .getElementById("reset-filters")
  .addEventListener("click", resetFilters);

/* === FIN PARTIE FILTRAGE === */

/* === PARTIE SAISIE MANUELLE === */

// Convertit la saisie texte en tableau d'IDs (ex: "1,2-5" => [1,2,3,4,5])
function parseRuleInput(input) {
  if (!input.trim()) return [];

  const parts = input.split(",");
  const ids = new Set();

  parts.forEach((part) => {
    part = part.trim();
    if (part.includes("-")) {
      // Gestion des plages (ex: 2-5)
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        ids.add(i);
      }
    } else if (part) {
      // Ajout d'un ID simple
      ids.add(Number(part));
    }
  });

  return Array.from(ids);
}


// Affiche les résultats de la sélection manuelle
function renderManualSelectionResults(filteredRules, selectedIds) {
  const rulesContainer = document.getElementById("rules-list");
  rulesContainer.innerHTML = "";

  if (filteredRules.length === 0) {
    rulesContainer.innerHTML = `
        <div class="alert alert-warning">
          Aucune règle ne correspond aux numéros saisis (IDs valides: 1-${universityData.timetabling.rules.length})
        </div>
      `;
    return;
  }

  // Réutilise la fonction de rendu existante
  renderRulesDetails({ rules: filteredRules });

  // Met en surbrillance les règles sélectionnées
  selectedRuleIds.clear();
  filteredRules.forEach((rule) => {
    const index = universityData.timetabling.rules.indexOf(rule);
    if (index !== -1) {
      selectedRuleIds.add(rule.id);
    }
  });

  // Met à jour visuellement la sélection
  document.querySelectorAll(".rule-box").forEach((box, index) => {
    if (selectedIds.includes(index + 1)) {
      box.classList.add("selected");
    }
  });

  // Affiche le compte
  const countElement = document.createElement("div");
  countElement.className = "mb-3 text-muted";
  countElement.textContent = `${
    filteredRules.length
  } règles sélectionnées (IDs: ${selectedIds.join(", ")})`;
  rulesContainer.prepend(countElement);
}

// Réinitialise la sélection manuelle
function resetManualSelection() {
  document.getElementById("deactivate-rules").value = "";
  renderRulesDetails(universityData);
}

/* === FIN PARTIE SAISIE MANUELLE === */
