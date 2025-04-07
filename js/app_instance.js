
//PARTIE 1
/* Gestion de la complétion des textes et le chargement des formations depuis l'API*/

const apiBaseUrl = "http://localhost:8080/api"; // Base de l'API (ici url vers l'api avec le port 8080 , et 8081 pour une modif par exemple)

const searchInput = document.getElementById("instance-search"); // Barre de recherche
const suggestionsBox = document.getElementById("suggestions"); // Boîte des suggestions
const instanceSelect = document.getElementById("instance-type-filter"); // Select des formations
const periodContainer = document.getElementById("period-container"); // Conteneur des périodes
const periodSelect = document.getElementById("period-select"); // Select des périodes
const selectAllButton = document.getElementById("select-all"); // Bouton "Tout sélectionner"


/*
formationList est un tableau d'objet : voila un peu la structure : 
formations: 
Array(624) [ {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, … ]
[0…99]
0: Object { cnucode: "None", cnuname: "None", coursename: "Econométrie 2 - P13", … }
cnucode: "None"
cnuname: "None"
coursename: "Econométrie 2 - P13"
coursenumber: "TMA3308U"
elpccode: "CHAR"
elpname: "Charges d'Enseignement"
id: 156
<prototype>: Object { … }

L'idée derniere c'est de remplir dynamiquement les options de formations avec les données qu'on dispose dans l'API 
I- on recupere toutes les formations dans un tableau
II- on parcours le tableau et on prends le nom de chaque formation 

<option value="formation.id"> formation.name</option>

Les options sont des enfants de select : <select id="instance-type-filter" class="form-select"></select>
Finalement on a : 
<select id="instance-type-filter" class="form-select">
<option value="formation.id"> formation.name</option>
<option value="formation.id"> formation.name</option>
...
</select>


*/
let formationsList = []; // Stockage des formations pour la recherche

// Fonction pour récupérer les formations depuis l'API
async function fetchFormations() {
    try {
        // ici on précise bien qu'on recupere les formations parmis les données ( @THI VI c'est ici que tu te plante peut-etre)
        const response = await fetch(`${apiBaseUrl}/formations/`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des formations");
        
        const formations = await response.json();
        formationsList = formations; // Stocker pour la barre de suggestion

        // Ajout dynamique des formations au <select>
        instanceSelect.innerHTML = '<option value="all">Sélectionner les formations</option>';
        formations.forEach(formation => {
            let option = document.createElement("option");
            option.value = formation.id; // Utilise l'ID comme valeur
            option.textContent = formation.name; // Utilise le nom comme texte
            instanceSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Erreur :", error);
    }
}

/*
Pour recupérer les périodes d'une formations ,on utilise l'Endpoint /api/steps/formation/<formation_id> [GET] 
on passe l'id et on a toutes les pérides(ou semestre) de la formation
un exe : 
Array(315) [ {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, … ]
[0…99]
0: Object { formation_id: "TL2PC11", id: 129, periodcode: "None", … }
formation_id: "TL2PC11"
id: 129
periodcode: "None"
periodname: "None"
<prototype>: Object { … }

*/

// Fonction pour récupérer les périodes d'une formation depuis l'API

async function fetchPeriods(formationId) {
    try {
        
        const response = await fetch(`${apiBaseUrl}/steps/formation/${formationId}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des périodes");

        const steps = await response.json();

        // Maintenant steps contient les données complètes pour cette formation
        const periods = steps
            .filter(step => step.periodcode !== "None")
            .map(step => ({
                id: step.id,               // L'ID unique de la période
                code: step.periodcode,     // Le code (ex: "P1")
                //name: step.periodname || step.periodcode  // on peut aussi envisager de prendre le nom entier de la formation( à voir lundi avec les encadrants)
            }));
           
        updatePeriods(periods);
    } catch (error) {
        console.error("Erreur :", error);
    }
}


// Mise à jour dynamique du select des périodes
function updatePeriods(periods) {
    periodSelect.innerHTML = ""; // Vider la liste des périodes

    if (periods.length > 0) {
        periodContainer.style.display = "block";
        periods.forEach(period => {
            let option = document.createElement("option");
            option.value = period.id;
            //console.log("valeur id : " + period.id)
            option.textContent = period.code;
            periodSelect.appendChild(option);
        });
    } else {
        periodContainer.style.display = "none";
    }
}

// Écouteur d'événement sur la sélection d'une formation
instanceSelect.addEventListener("change", function () {
    const selectedFormationId = instanceSelect.value;
    if (selectedFormationId !== "all") {
        fetchPeriods(selectedFormationId);
    } else {
        updatePeriods([]); // Vide les périodes si "séléctionner une formation" est sélectionné
    }
});

/*
Cette partie correspond à la barre de suggestion qui prends juste le ou les caractere selectionné et faire un regex sur la liste des formation
en gros ( debut* == formation.name) 
*/
// Fonction pour mettre à jour la barre de suggestion
searchInput.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";

    if (query.length === 0) {
        suggestionsBox.style.display = "none";
        return;
    }

    // Filtrage des formations correspondant à la recherche
    const filteredInstances = formationsList.filter(inst => inst.name.toLowerCase().includes(query));

    if (filteredInstances.length > 0) {
        suggestionsBox.style.display = "block";
        filteredInstances.forEach(inst => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion");
            suggestionItem.textContent = inst.name;

            suggestionItem.addEventListener("click", function () {
                searchInput.value = inst.name;
                instanceSelect.value = inst.id;
                fetchPeriods(inst.id);
                suggestionsBox.style.display = "none";
            });

            suggestionsBox.appendChild(suggestionItem);
        });
    } else {
        suggestionsBox.style.display = "none";
    }
});

//  Masque(rendre le style display = "none") les suggestions lorsqu'on clique ailleurs
document.addEventListener("click", function (e) {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = "none";
    }
});

// Au démarrage les formations sont chargées en premier
fetchFormations();

// Sélectionner toutes les périodes disponibles
selectAllButton.addEventListener("click", function () {
  for (let option of periodSelect.options) {
    option.selected = true;
  }
      // Afficher le bouton de confirmation après la sélection
  document.getElementById("confirmation-container").style.display = "inline-block";

}); 


// PARTIE 2 : VISUALISATION DE LA/LES FORMATION.S SELECTIONNÉE 
/* Gestion des sélections de formations et périodes */

let allSelections = []; // Stocke toutes les sélections {formation, periods}

// Événement quand on change la sélection des périodes
document.getElementById("period-select").addEventListener("change", function() {
    const hasSelection = this.selectedOptions.length > 0;
    document.getElementById("confirmation-container").style.display = 
        hasSelection ? "inline-block" : "none";
});


// Confirmation de la sélection
document.getElementById("confirm-selection").addEventListener("click", function() {
    const formationId = document.getElementById("instance-type-filter").value;
    const formation = formationsList.find(f => f.id == formationId) || 
                     { id: formationId, name: "Formation inconnue" };
    const periods = Array.from(document.getElementById("period-select").selectedOptions)
    .map(option => ({
        id: option.value,    // L'ID de la période
        code: option.text    // Le code (P1, P2, etc.)
    }));

    const isEdit = this.hasAttribute('data-edit-index');
    
    if (isEdit) {
        // Modification d'une sélection existante
        const index = parseInt(this.getAttribute('data-edit-index'));
        allSelections[index] = { formation, periods };
        this.removeAttribute('data-edit-index');
    } else {
        // Nouvelle sélection
        allSelections.push({ formation, periods });
    }

    updateSummaryDisplay();
    resetSelectionInterface();
});
/* desactiver le bouton "lancer la recherche*/ 
function checkSelections() {
    const searchButton = document.getElementById("search-button");
    if (allSelections.length > 0) {
        searchButton.disabled = false;
    } else {
        searchButton.disabled = true;
    }
}



// Mise à jour de l'affichage du résumé
function updateSummaryDisplay() {
    const summaryContainer = document.getElementById("summary-container");
    const itemsContainer = document.getElementById("selection-items-container") || 
                         (() => {
                             const div = document.createElement("div");
                             div.id = "selection-items-container";
                             summaryContainer.appendChild(div);
                             return div;
                         })();

    // Liste complète des sélections
    itemsContainer.innerHTML = allSelections.map((selection, index) => `
    <div class="selection-item mb-3 p-2 border rounded">
        <div><strong>Formation :</strong> ${selection.formation.name}</div>
        <div><strong>Périodes :</strong> ${selection.periods.map(p => p.code).join(", ")}</div>
        <div class="mt-2">
            <button class="btn btn-sm btn-warning me-2 edit-selection" data-index="${index}">Modifier</button>
            <button class="btn btn-sm btn-danger remove-selection" data-index="${index}">Supprimer</button>
        </div>
    </div>
`).join('');

    // Gestion des événements
    document.querySelectorAll(".remove-selection").forEach(btn => {
        btn.addEventListener("click", function() {
            allSelections.splice(parseInt(this.dataset.index), 1);
            updateSummaryDisplay();
            checkSelections();
        });
    });

    document.querySelectorAll(".edit-selection").forEach(btn => {
        btn.addEventListener("click", function() {
            const index = parseInt(this.dataset.index);
            const { formation, periods } = allSelections[index];
            
            document.getElementById("instance-type-filter").value = formation.id;
            fetchPeriods(formation.id).then(() => {
                const periodSelect = document.getElementById("period-select");
                Array.from(periodSelect.options).forEach(opt => {
                    opt.selected = periods.includes(opt.text);
                });
                
                document.getElementById("confirm-selection")
                      .setAttribute('data-edit-index', index);
                document.getElementById("period-container").style.display = "block";
                document.getElementById("confirmation-container").style.display = "inline-block";
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
document.getElementById("edit-selection")?.addEventListener("click", function() {
    document.getElementById("period-container").style.display = "block";
    document.getElementById("summary-container").style.display = "none";
    resetSelectionInterface();
});






/* requete API  Pour cette partie est un peu provisoir puisqu'elle n'est pas trop optimisée on va penser à unitilisé 
plus tard un systeme de cache (et en plus pour l'instant on fait des requetes un peu inutule)
*/ 

// recupérer les salles : 
        // LES SALLES
let rooms = [];
/* ici on récupère  name ; capacite ;  building 
parce que la structure xml est : 
id = name
capacity = capacite
label = building
ex : <room id="AMPHI-A" capacity="90" label="BUILDING-A"/>
*/

async function fetchClassrooms() {
    try {
        const response = await fetch(`${apiBaseUrl}/classrooms/`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des salles");
        
        const roomsData = await response.json();
        
        // Transformation des données avec le nouveau format de label
        rooms = roomsData.map(room => ({
            id: room.name,          // Utilise le champ 'name' comme id
            capacity: room.capacite, // Utilise 'capacite' comme capacity
            label: `building-${room.building}`, // Format "building-A" etc.
            originalData: room      // Conserve les données originales ( qui sera utile plus tard pour les caches) c'est ici dont je parlais qu'on pourrait optimisé
        }));
        
        //console.log("Salles :", salles);
        return rooms;
        
    } catch (error) {
        console.error("Erreur :", error);
        return [];
    }
}

// Génération du XML des rooms(les salles)
async function logClassrooms() {
    const rooms = await fetchClassrooms();

    
    // Génération du XML 
    const roomsXML = rooms.map(room => 
        `<room id="${room.id}" capacity="${room.capacity}" label="${room.label.toUpperCase()}"/>`
    ).join('\n');
    
    //console.log(roomsXML);
    return roomsXML;
}

//logClassrooms();




// LES TEACHERS
/* Ici également on doit récupérer uniquement les enseignants des périodes sélectionnéec 
Mais pour l'instant on récupere les tous les enseignants , ce qui n'est pas correct:
La démarche doit etre : 
-> récupérer les cours d'une périodes -> récupérer les enseignants dont ces cours sont assignées (table lecturer_assignments)
*/

let teachers = [];
async function fetchTeachers() {
    try {
        const response = await fetch(`${apiBaseUrl}/lecturers/`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des enseignants");
        
        const teachersData = await response.json();
        
        // Transformation avec le format d'ID original (nom prénom)
        teachers = teachersData.map(teacher => ({
            id: `${teacher.lastname} ${teacher.name}`,  // Format "lebon marguerite"
            label: teacher.code_unite || '', // Label brut exact
            originalData: teacher // Conservation des données brutes ( à gérer plus tard pour le cache ( à demander à Mr SIMON))
        }));
        
        return teachers;
        
    } catch (error) {
        console.error("Erreur :", error);
        return [];
    }
}
//Génération du XML des teachers
async function generateTeachersXML() {
    const teachers = await fetchTeachers();
    const teachersXML = teachers.map(teacher => 
        `<teacher id="${teacher.id}" label="${teacher.label}"/>`
    ).join('\n');
    //console.log(teachersXML)
    return teachersXML;
}
//generateTeachersXML()


// LES COURSES

/*
récupérer toute les périodes dans un tableau ICI à retravailler 
*/


// Fonction pour récupérer les périodes groupées par formation
function getAllPeriodIds() {
    return allSelections.flatMap(selection => 
        selection.periods.map(period => period.id)
    );
}

document.getElementById("search-button").addEventListener("click", function() {
    const searchData = getAllPeriodIds();
    
    console.log("Données complètes pour la recherche :", searchData);

});


// récupérer les id de tous les cours
async function fetchCourseIdsForSelectedPeriods() {
    const periodIds = getAllPeriodIds(); // Récupère les IDs de période
    let courseIds = [];

    for (const periodId of periodIds) {
        try {
            const response = await fetch(`${apiBaseUrl}/courses/step/${periodId}`);
            if (!response.ok) throw new Error(`Erreur ${response.status} pour ${periodId}`);
            
            const courses = await response.json();
            courseIds = [...courseIds, ...courses.map(course => course.id)]; // Extraction des IDs
        } catch (error) {
            console.error(`Erreur pour la période ${periodId}:`, error);
        }
    }
    return courseIds; 
}

// récupérer le talbeau modalité :
async function fetchModalitiesByCourseIds(courseIds) {
    const allModalities = [];
    
    // Version optimisée avec Promise.all() ???? à revoir aussi 
    const requests = courseIds.map(async courseId => {
        try {
            const response = await fetch(`${apiBaseUrl}/modalities/course/${courseId}`);
            if (!response.ok) throw new Error(`Statut ${response.status} pour le cours ${courseId}`);
            
            return await response.json();
        } catch (error) {
            console.error(`Erreur pour le cours ${courseId}:`, error);
            return [];
        }
    });

    const results = await Promise.all(requests);
    console.log(results)
    return results.flat();
}

// ICI j'ai les ids des cours et les modalité de ces id ( la table modalities)

async function getCoursesWithModalities() {
    try {
        // 1.  IDs des cours
        const courseIds = await fetchCourseIdsForSelectedPeriods();
        
        // 2.  les modalités
        const modalities = await fetchModalitiesByCourseIds(courseIds);
        
        // 3. Grouper par cours
        const coursesMap = new Map();
        
        modalities.forEach(modality => {
            if (!coursesMap.has(modality.course_id)) {
                coursesMap.set(modality.course_id, {
                    id: modality.course_id,
                    modalities: []
                });
            }
            coursesMap.get(modality.course_id).modalities.push({
                type: modality.modality,
                hours: modality.hours,
                groups: modality.groups,
                modalityId: modality.id
            });
        });
        
        // Convertir la Map en tableau
        return Array.from(coursesMap.values());
        
    } catch (error) {
        console.error("Erreur:", error);
        return [];
    }
}

//vérif
document.getElementById("search-button").addEventListener("click", async () => {
    const structuredCourses = await getCoursesWithModalities();
    //console.log("Cours structurés:", structuredCourses);
    
});


async function generateCoursesXML() { // à modifier demain
    try {
        // 1.  les cours structurés avec leurs modalités
        const structuredCourses = await getCoursesWithModalities();
        
        // 2.  les données supplémentaires nécessaires ... Tres mauvaises idée
        const [coursesData, classrooms, teachers] = await Promise.all([
            fetch(`${apiBaseUrl}/courses/`).then(r => r.json()),
            fetch(`${apiBaseUrl}/classrooms/`).then(r => r.json()),
            fetch(`${apiBaseUrl}/lecturers/`).then(r => r.json())
        ]);

        let coursesContent = ''; // concetenu XML
        
        for (const course of structuredCourses) {
            // Trouver les infos complémentaires du cours
            const courseInfo = coursesData.find(c => c.id === course.id) || {};
            
            coursesContent += `  <course id="${courseInfo.coursename || course.id}">\n`;
            
            // Pour chaque modalité
            for (const modality of course.modalities) {
                // Déterminer le label
                const labelMap = {
                    'lecture': 'LECTURE',
                    'tutorial': 'TUTORIAL',
                    'practical': 'PRACTICAL',
                    'lab': 'LABORATORY',
                    'eval': 'EVAL'
                };
                const label = labelMap[modality.type.toLowerCase()] || modality.type.toUpperCase();
                
                coursesContent += `    <part id="${courseInfo.coursename || course.id}-${modality.type}" nrSessions="${modality.hours || 1}" label="${label}">\n`;
                
                // Classes
                coursesContent += `      <classes>\n`; // à modifier (+question au prof)
                for (let i = 1; i <= (modality.groups || 1); i++) {
                    coursesContent += `        <class id="${courseInfo.coursename || course.id}-${modality.type}-${i}" maxHeadCount="${modality.max_headcount || 30}"/>\n`;
                }
                coursesContent += `      </classes>\n`;
                
                // Slots horaires
                coursesContent += `      <allowedSlots sessionLength="${modality.hours || 120}">\n`;
                coursesContent += `        <dailySlots>480,530,570,620,660,710,750,800,840,890,930,980,1020</dailySlots>\n`;
                coursesContent += `        <days>1-5</days>\n`;
                coursesContent += `        <weeks>1-12</weeks>\n`;
                coursesContent += `      </allowedSlots>\n`;
                
                // Salles (3 premières salles associées au cours ou par défaut)
                coursesContent += `      <allowedRooms sessionRooms="single">\n`;
                const courseRooms = classrooms.filter(r => r.course_id == course.id).slice(0, 3);
                for (const room of courseRooms.length ? courseRooms : classrooms.slice(0, 2)) {
                    coursesContent += `        <room refId="${room.name}"/>\n`;
                }
                coursesContent += `      </allowedRooms>\n`;
                
                // Enseignants (1er enseignant associé ou par défaut)
                coursesContent += `      <allowedTeachers sessionTeachers="1">\n`;
                const courseTeachers = teachers.filter(t => t.course_id == course.id).slice(0, 1);
                for (const teacher of courseTeachers.length ? courseTeachers : teachers.slice(0, 1)) {
                    coursesContent += `        <teacher refId="${teacher.lastname} ${teacher.name}" nrSessions="${modality.nb_sessions || 1}"/>\n`;
                }
                coursesContent += `      </allowedTeachers>\n`;
                
                coursesContent += `    </part>\n`;
            }
            
            coursesContent += `  </course>\n`;
        }
        
        return coursesContent; 
        
    } catch (error) {
        console.error("Erreur lors de la génération du XML des cours:", error);
        return ''; //  une chaîne vide en cas d'erreur
    }
}







// Configuration de base pour visualiser le XML 

async function generateCompleteTimetabling() {
    const [roomsXML, teachersXML, coursesXML] = await Promise.all([
        logClassrooms(), 
        generateTeachersXML(),
        generateCoursesXML()
    ]);

    return `<?xml version="1.0" encoding="UTF-8"?>
<timetabling 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="usp_timetabling_v0_2.xsd"
    name="ua_l3info_2021"
    nrWeeks="12"
    nrDaysPerWeek="5"
    nrSlotsPerDay="1440">
<rooms>
${roomsXML}
</rooms>
<teachers>
${teachersXML}
</teachers>
<courses>
${coursesXML}
</courses>
</timetabling>`;
}

// Proposer  le téléchargement
function downloadXML(xmlContent) {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emploi_du_temps.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


document.getElementById('search-button').addEventListener('click', async function() {
    try {
        // Désactive le bouton pendant la génération
        const downloadBtn = document.getElementById('download-xml');
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Génération en cours...';
        
        // 2. Génère le XML
        const xml = await generateCompleteTimetabling();
        
        // 3. Active le bouton de téléchargement
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Visualiser le XML';
        
        // 4. Stocke le XML pour téléchargement
        downloadBtn.onclick = () => downloadXML(xml);
        
    } catch (error) {
        console.error("Erreur:", error);
        document.getElementById('download-xml').textContent = 'Erreur de génération';
    }
});



// Désactiver le bouton au chargement initial
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("search-button").disabled = true;
});