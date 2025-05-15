

let instance_id = null;

// ==== Démmarer le solveur ( avec l'id = start-solver) ==== 
document.getElementById("start-solver").addEventListener("click", async () => {
  try {
    //  la barre de progression avec l'état "PARSING"
    updateProgressBar("PARSING");

    const { instance, strategy } = await chargerInstanceEtStrategie();
    const creationResponse = await fetch("http://localhost:8080/solver/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instance, strategy }),
    });
    const creationJson = await creationResponse.json();
    if (!creationJson.success)
      throw new Error("Erreur de création de l'instance.");

    instance_id = creationJson.controller.id;
    enableStopButton(true);
    
    await attendreEtat("READY");
    updateProgressBar("SOLVING");

    const startResponse = await fetch(
      `http://localhost:8080/solver/${instance_id}/start`,
      { method: "POST" }
    );
    if (!startResponse.ok)
      throw new Error("Erreur lors du démarrage du solveur.");

    await attendreEtat("FINISHED");
    enableStopButton(false);
    await chargerResultatSolveur(instance_id);
    
  } catch (error) {
    console.error("Erreur :", error);
    updateProgressBar("FAILED");
    alert(error.message);
  }
});

// ARRETER LE SOLVEUR //
const stopSolverBtn = document.getElementById("stop-solver");
function setStopButtonState(active) {
  stopSolverBtn.disabled = !active;
  stopSolverBtn.innerHTML = active
    ? '<i class="bi bi-stop-circle"></i> Arrêter le solveur'
    : '<i class="bi bi-hourglass"></i> Arrêt en cours...';
}
stopSolverBtn.addEventListener("click", async () => {
  if (!instance_id) {
    alert("Aucune instance active.");
    return;
  }
  setStopButtonState(false);

  try {
    const response = await fetch(
      `http://localhost:8080/solver/${instance_id}/stop`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "Instance introuvable"
          : "Erreur lors de l'arrêt du solveur"
      );
    }

    // Mise à jour de l'interface
    document.getElementById("solver-status").textContent = "Arrêté";
    document.getElementById("solver-status").className = "badge bg-warning";
    console.log("Solveur arrêté avec succès");
  } catch (error) {
    console.error("Erreur :", error);
    alert(`Échec de l'arrêt : ${error.message}`);

    // Le bouton arreter le solveur est reactivé en cas d'erreur
    setStopButtonState(true);
  }
});

function enableStopButton(enable) {
  if (enable) {
    stopSolverBtn.style.display = "block"; // affiche l'élément
    setStopButtonState(true);
  } else {
    stopSolverBtn.style.display = "none"; // Cache l'élément
  }
}

// La barre de progression
// Cette partie gère la barre de progression et les états du solveur
// Les états possibles du solveur
// sont définis dans l'objet SOLVER_STATES
const SOLVER_STATES = {
  PARSING: { percent: 10, label: "Analyse des données..." },
  READY: { percent: 30, label: "Prêt à démarrer..." },
  SOLVING: { percent: 60, label: "Résolution en cours..." },
  FINISHED: { percent: 100, label: "Terminé avec succès!" },
  FAILED: { percent: 100, label: "Échec de la résolution", error: true }
};

function updateProgressBar(state) {
  const progressBar = document.getElementById("solver-progress");
  const progressInfo = SOLVER_STATES[state] || { percent: 0, label: "" };
  
  // Mise à jour visuelle
  progressBar.style.width = `${progressInfo.percent}%`;
  progressBar.textContent = progressInfo.label;
  
  // Changement de couleur selon l'état
  if (progressInfo.error) {
    progressBar.classList.remove("bg-success", "bg-info");
    progressBar.classList.add("bg-danger");
  } else if (state === "FINISHED") {
    progressBar.classList.remove("bg-info");
    progressBar.classList.add("bg-success");
  } else {
    progressBar.classList.remove("bg-success", "bg-danger");
    progressBar.classList.add("bg-info");
  }
  
  // Mise à jour du statut dans l'interface
  const solverStatus = document.getElementById("solver-status");
  if (solverStatus) {
    solverStatus.textContent = state;
    solverStatus.className = progressInfo.error 
      ? "badge bg-danger" 
      : state === "FINISHED" 
        ? "badge bg-success" 
        : "badge bg-primary";
  }
}

async function attendreEtat(etatVise) {
  // Initialiser la barre de progression avec l'état "PARSING"
  updateProgressBar("PARSING");
  
  while (true) {
    try {
      const statusResponse = await fetch(
        `http://localhost:8080/solver/${instance_id}/status`
      );
      const statusJson = await statusResponse.json();
      const etatActuel = statusJson.controller?.status;

      // Mettre à jour la barre de progression selon l'état actuel
      if (SOLVER_STATES[etatActuel]) {
        updateProgressBar(etatActuel);
      }

      if (etatActuel === etatVise) {
        return;
      } else if (etatActuel === "FAILED") {
        throw new Error("Problème dans la résolution / parsing.");
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      updateProgressBar("FAILED");
      throw error;
    }
  }
}

/* Fonction pour récupérer le résultat du solveur ( avec endpoint = /solver/{id}/result)
// id est l'ID de l'instance du solveur
// La fonction renvoie un objet contenant la solution et les statistiques
// La fonction gère également les erreurs de parsing 
*/
async function recupererResultatSolveur(id) {
  if (!id) throw new Error("ID d'instance manquant");
  const response = await fetch(`http://localhost:8080/solver/${id}/result`);
  const json = await response.json();
  //console.log("Contenu de la réponse du solveur:", JSON.stringify(json, null, 2));

  let solution = json.solution || json;
  let statistics = json.statistics || json;

  if (typeof solution === "string") {
    try {
      solution = JSON.parse(solution);
    } catch (e) {
      throw new Error("La solution est invalide (JSON mal formé).");
    }
  }

  if (typeof statistics === "string") {
    try {
      statistics = parseStatistics(statistics);
      //console.log("statistique  :", statistics);
    } catch (e) {
      throw new Error("Les statistiques sont invalides (mal formées).");
    }
  }

  return { solution, statistics };
}

/* Fonction pour afficher les résultats du solveur
// solution est l'objet contenant la solution du solveur
// statistics est l'objet contenant les statistiques du solveur
// Cette fonction met à jour l'interface utilisateur avec les résultats
// et les statistiques
// Elle affiche également un message de succès ou d'échec selon le statut du solveur
*/
async function afficherResultatsSolveur(solution, statistics) {
  afficherStatsSolution(solution, statistics);

  const solverStatus = document.getElementById("solver-status");
  if (solverStatus) {
    solverStatus.textContent = "Terminé";
    solverStatus.className = "badge bg-success";
  }

  document.getElementById("results-content").style.display = "block";

  const exportBtn = document.getElementById("export-solution");
  if (exportBtn) {
    exportBtn.disabled = false;
    const xmlBase = await generateCompleteTimetabling();
    const solutionWithSessions = exporterSolutionXML(xmlBase, solution);

    exportBtn.onclick = () => downloadXML(solutionWithSessions);
    // dans le cas où on veut exporter en JSON ( à décider plus tard par les chercheurs de LERIA)
    //exportBtn.onclick = () => exporterSolutionJSON(solution);
  }
}

async function chargerResultatSolveur(id) {
  const solverStatus = document.getElementById("solver-status");

  try {
    const { solution, statistics } = await recupererResultatSolveur(id);
    afficherResultatsSolveur(solution, statistics);
  } catch (error) {
    console.error("Erreur lors du chargement du résultat :", error);

    if (solverStatus) {
      solverStatus.textContent = "Échec";
      solverStatus.className = "badge bg-danger";
    }
    document.getElementById("results-content").style.display = "block";
  }
}

// dans le cas où on veut exporter en JSON ( à décider plus tard par les chercheurs de LERIA)
/*
function exporterSolutionJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solution_${instance_id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}*/

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

/*
// Fonction pour générer le XML complet
// avec les data du périmètre + les sessions de la solution
// la fonction prend en entrée une chaîne XML de base ( renvoyée par generateCompleteTimetabling)
// et qui contenait avec les toues les données sauf la partie <sessions> de la solution
// cette fonction va générer le bloc <sessions> à partir de data.sessions
// et l'insérer dans le XML de base
// En sortie, elle renvoie le XML complet(ce qui pourra etre téléchargé par l'utilisateur pour visionnage )
*/
function exporterSolutionXML(xmlString, data) {
  // Génération du bloc <sessions> à partir de data.sessions
  const sessionsXml = data.sessions
    .map((session) => {
      const roomsXml = session.rooms
        .map((roomId) => `        <room refId="${roomId}" />`)
        .join("\n");

      const teachersXml = session.teachers
        .map((teacherId) => `        <teacher refId="${teacherId}" />`)
        .join("\n");

      const startingSlot = session.startingSlot;

      return `    <session num="${session.num}" rank="${session.rank}" class="${session.class}">
        <startingSlot slot="${startingSlot.slot}" dailySlot="${startingSlot.dailySlot}" day="${startingSlot.day}" week="${startingSlot.week}" />
        <rooms>
${roomsXml}
        </rooms>
        <teachers>
${teachersXml}
        </teachers>
    </session>`;
    })
    .join("\n");

  const sessionsBlock = `    <sessions>\n${sessionsXml}\n    </sessions>`;

  // Insertion du bloc <sessions> dans la balise <solution> après </groups>
  const updatedXml = xmlString.replace(/(<\/groups>)/, `$1\n${sessionsBlock}`);

  return updatedXml;
}

// cette fonction récupere le JSON de configuration ( périmètre + stratégie)
async function chargerInstanceEtStrategie() {
  if (!universityData) {
    throw new Error(
      "Données d'instance non chargées. Vérifie ton JS ou l'étape de sélection."
    );
  }
  const instance = universityData;
  const strategy = generateConfigJSON();
  return { instance, strategy };
}

/*
// Fonction pour parser les statistiques
// de la réponse brute du solveur puisque le solveur renvoie les statistiques en format brut
// (chaîne de caractères) et on doit les parser pour les convertir
// en un objet JavaScript ( plus facile à manipuler)
*/
function parseStatistics(raw) {
  const stats = {};
  raw.split("\n").forEach((line) => {
    const parts = line.split(";");
    if (parts.length === 2) {
      const key = parts[0].trim().replace(/\u200B/g, ""); // supprime ZWSP
      const value = parts[1].trim();
      stats[key] = isNaN(value) ? value : parseFloat(value);
    }
  });
  return stats;
}

// Cette fonction affiche les statistiques de la solution
function afficherStatsSolution(solution, statistics) {
  const statsContainer = document.getElementById("solution-stats");
  statsContainer.innerHTML = "";

  // Calcul des statistiques
  const nbSessions = solution.sessions?.length || 0;
  const nbGroupes = universityData.timetabling.solution.groups.length || 0;
  const nbClasses = new Set(solution.sessions?.map((s) => s.class)).size || 0;
  const nbTeachers =
    new Set(solution.sessions?.flatMap((s) => s.teachers)).size || 0;
  const nbRooms = new Set(solution.sessions?.flatMap((s) => s.rooms)).size || 0;

  const resolutionTime = parseFloat(statistics.getResolutionTime || 0).toFixed(
    3
  );
  const creationTime = parseFloat(
    statistics.getCreationTime
      ?.toString()
      .trim()
      .replace(/[^\d.-]/g, "") || 0
  ).toFixed(3);
  const totalTime = (
    parseFloat(resolutionTime) + parseFloat(creationTime)
  ).toFixed(3);
  const efficiencyRatio = (
    statistics.getNodeCount / statistics.getDecisionCount || 0
  ).toFixed(2);

  statsContainer.innerHTML = `
    <div class="stats-wrapper">
      <!-- Colonne Gauche - Résultats (inchangée) -->
      <div class="stats-column left-column">
        <h3 class="column-title">
          <i class="bi bi-calendar-week"></i> Résultats du planning
        </h3>
        <div class="stats-grid">
          ${[
            {
              label: "Séances planifiées",
              value: nbSessions,
              icon: "bi-calendar-event",
              color: "primary",
            },
            {
              label: "Groupes constitués",
              value: nbGroupes,
              icon: "bi-people",
              color: "success",
            },
            {
              label: "Classes",
              value: nbClasses,
              icon: "bi-journal-bookmark",
              color: "info",
            },
            {
              label: "Enseignants",
              value: nbTeachers,
              icon: "bi-person-badge",
              color: "warning",
            },
            {
              label: "Salles utilisées",
              value: nbRooms,
              icon: "bi-building",
              color: "danger",
            },
          ]
            .map(
              (stat) => `
            <div class="stat-item bg-${stat.color}-subtle">
              <i class="bi ${stat.icon}"></i>
              <div class="stat-content">
                <span class="value">${stat.value}</span>
                <span class="label">${stat.label}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <!-- Colonne Droite - Performance-->
      <div class="stats-column right-column">
        <h3 class="column-title">
          <i class="bi bi-speedometer"></i> Performance du solveur
        </h3>
        
        <div class="performance-stats">
          <!-- Temps d'exécution -->
          <div class="performance-card time-card">
            <div class="card-header">
              <i class="bi bi-stopwatch"></i>
              <span>Temps d'exécution</span>
            </div>
            <div class="main-value">${totalTime}s</div>
            <div class="time-details">
              <div><span>Création :</span> ${creationTime}s</div>
              <div><span>Résolution :</span> ${resolutionTime}s</div>
            </div>
          </div>
          
          <!--les indicateurs clés -->
          <div class="key-indicators">
            <div class="indicator success">
              <i class="bi bi-check-circle"></i>
              <div>
                <div class="indicator-value">${
                  statistics.getNrSolutions || 0
                }</div>
                <div class="indicator-label">Solutions</div>
              </div>
            </div>
            
            <div class="indicator efficiency">
              <i class="bi bi-lightning-charge"></i>
              <div>
                <div class="indicator-value">${efficiencyRatio}</div>
                <div class="indicator-label">Efficacité</div>
                <div class="indicator-detail">(Nœuds/Décisions)</div>
              </div>
            </div>
            
            <div class="indicator purity">
              <i class="bi bi-filter-circle"></i>
              <div>
                <div class="indicator-value">${
                  statistics.getFailCount || 0
                }</div>
                <div class="indicator-label">Échecs</div>
              </div>
            </div>
          </div>
          <div class="metrics-grid">
            <div class="metric-card">
              <i class="bi bi-diagram-3"></i>
              <div>
                <div class="metric-value">${statistics.getNodeCount || 0}</div>
                <div class="metric-label">Nœuds</div>
                <div class="metric-detail">Profondeur: ${
                  statistics.getCurrentDepth || 0
                }</div>
              </div>
            </div>
            
            <div class="metric-card">
              <i class="bi bi-arrow-left-right"></i>
              <div>
                <div class="metric-value">${
                  statistics.getDecisionCount || 0
                }</div>
                <div class="metric-label">Décisions</div>
              </div>
            </div>
            
            <div class="metric-card">
              <i class="bi bi-shield-lock"></i>
              <div>
                <div class="metric-value">${statistics.getNbCstrs || 0}</div>
                <div class="metric-label">Contraintes</div>
              </div>
            </div>
            
            <div class="metric-card">
              <i class="bi bi-puzzle"></i>
              <div>
                <div class="metric-value">${statistics.getNbVars || 0}</div>
                <div class="metric-label">Variables</div>
                <div class="metric-detail">${
                  statistics.getNbIntVar || 0
                } int, ${statistics.getNbBoolVar || 0} bool</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/*
// Cette partie se charge de la sauvegarde de la solution
// Vérifie si l'instance_id est défini
// et si le bouton "Enregistrer" est cliqué
// et envoie une requête POST à l'API pour sauvegarder la solution
// et renommer l'instance
*/
const saveButton = document.getElementById("save-solution");
const solutionNameInput = document.getElementById("solution-name");
if (saveButton) {
  saveButton.addEventListener("click", async function () {
    try {
      const solutionName = solutionNameInput.value.trim();

      // vérifier si un nom a été saisi
      if (!solutionName) {
        alert("Veuillez saisir un nom pour la solution");
        solutionNameInput.focus();
        return;
      }

      // vérifier si l'instance_id existe
      if (!instance_id) {
        alert("Aucune instance de solution active");
        return;
      }

      //afficher un indicateur de chargement
      saveButton.disabled = true;
      saveButton.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sauvegarde...';

      const requestData = {
        name: solutionName,
      };

      //l'endpoint de renommage de l'instance
      const response = await fetch(
        `http://localhost:8080/solver/${instance_id}/rename`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la sauvegarde: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      //console.log("Résultat de la sauvegarde:", result);

      // un message de succès ! bingo!!!!!
      alert("Solution sauvegardée avec succès sous le nom: " + solutionName);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde: " + error.message);
    } finally {
      // Réactiver le bouton
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="bi bi-save"></i> Enregistrer';
    }
  });
}
