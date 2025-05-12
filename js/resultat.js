let instance_id = null;

// ==== Gestion des boutons ====

document.getElementById("start-solver").addEventListener("click", async () => {
  try {
    const { instance, strategy } = await chargerInstanceEtStrategie();
    const creationResponse = await fetch("http://localhost:8080/solver/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instance, strategy })
    });
    const creationJson = await creationResponse.json();
    //console.log("Réponse de création :", creationJson); // Ajoute ce log
    if (!creationJson.success) throw new Error("Erreur de création de l'instance.");

    instance_id = creationJson.controller.id;
    console.log(`Instance créée avec ID : ${instance_id}`);

    enableStopButton(true);
    await attendreEtat("READY");

    const startResponse = await fetch(`http://localhost:8080/solver/${instance_id}/start`, {
      method: "POST"
    });
    if (!startResponse.ok) throw new Error("Erreur lors du démarrage du solveur.");

    //console.log("Solveur démarré.");
    
    await attendreEtat("FINISHED");
    enableStopButton(false);

    await chargerResultatSolveur(instance_id);

  } catch (error) {
    console.error("Erreur :", error);
    alert(error.message);
  }
});

  



// Référence au bouton
const stopSolverBtn = document.getElementById("stop-solver");

// Fonction pour activer/désactiver le bouton
function setStopButtonState(active) {
  stopSolverBtn.disabled = !active;
  stopSolverBtn.innerHTML = active 
    ? '<i class="bi bi-stop-circle"></i> Arrêter le solveur' 
    : '<i class="bi bi-hourglass"></i> Arrêt en cours...';
}

// Gestionnaire d'arrêt du solveur
stopSolverBtn.addEventListener("click", async () => {
  if (!instance_id) {
    alert("Aucune instance active.");
    return;
  }

  setStopButtonState(false); // Désactive le bouton pendant la requête
  
  try {
    const response = await fetch(`http://localhost:8080/solver/${instance_id}/stop`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(response.status === 404 
        ? "Instance introuvable" 
        : "Erreur lors de l'arrêt du solveur");
    }

    // Mise à jour de l'interface
    document.getElementById("solver-status").textContent = "Arrêté";
    document.getElementById("solver-status").className = "badge bg-warning";
    console.log("Solveur arrêté avec succès");

  } catch (error) {
    console.error("Erreur :", error);
    alert(`Échec de l'arrêt : ${error.message}`);
    
    // Réactive le bouton en cas d'erreur
    setStopButtonState(true);
  }
});

// Exposer cette fonction pour pouvoir l'utiliser ailleurs
function enableStopButton(enable) {
  if (enable) {
    stopSolverBtn.style.display = 'block'; // Change de 'hidden' à 'block'
    setStopButtonState(true);
  } else {
    stopSolverBtn.style.display = 'none'; // Cache complètement l'élément
  }
}


/*
document.getElementById("clear-instance").addEventListener("click", async () => {
  if (!instance_id) {
    alert("Aucune instance à supprimer.");
    return;
  }

  if (!confirm("Veux-tu vraiment supprimer l'instance ?")) return;

  try {
    const response = await fetch(`http://localhost:8080/solver/${instance_id}/clear`, {
      method: "POST"
    });
    if (response.ok) {
      console.log("Instance supprimée.");
      instance_id = null;
      activerBoutonsAction(false);
    } else {
      throw new Error("Erreur lors de la suppression de l'instance.");
    }
  } catch (error) {
    console.error("Erreur :", error);
    alert(error.message);
  }
});
*/
// ==== Fonctions principales ====

// Fonction pour attendre un état spécifique du solveur

async function attendreEtat(etatVise) {
  while (true) {
    const statusResponse = await fetch(`http://localhost:8080/solver/${instance_id}/status`);
    const statusJson = await statusResponse.json();
    const etatActuel = statusJson.controller?.status; // Sois précis ici

    console.log(`État actuel : ${etatActuel}`);
    // ici prévoir une affichage sur le front pour l'état actuel
    if (etatActuel === etatVise) {
      return;
    } else if (etatActuel === "FAILED") {
      // Si le solveur échoue, on arrête la boucle
      throw new Error("Problème dans la résolution / parsing .");
    }
    //console.log(`Attente de l'état : ${etatVise}...`);
    // On attend un peu avant de vérifier à nouveau
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Fonction pour récupérer le résultat du solveur
async function recupererResultatSolveur(id) {
  if (!id) throw new Error("ID d'instance manquant");

  const response = await fetch(`http://localhost:8080/solver/${id}/result`);
  const json = await response.json();
  console.log("Contenu de la réponse du solveur:", JSON.stringify(json, null, 2));

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
      console.log("statistique 2 :", statistics);
    } catch (e) {
      throw new Error("Les statistiques sont invalides (mal formées).");
    }
  }

  return { solution, statistics };
}


function afficherResultatsSolveur(solution, statistics) {
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
    exportBtn.onclick = () => exporterSolutionJSON(solution); 
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
}
/*
function activerBoutonsAction(active) {
  document.getElementById("stop-solver").disabled = !active;
  document.getElementById("clear-instance").disabled = !active;
}*/

// ==== Simulateur d'instance / stratégie ====

async function chargerInstanceEtStrategie() {
  if (!universityData) {
    throw new Error("Données d'instance non chargées. Vérifie ton JS ou l'étape de sélection.");
  }
  const instance = universityData;
  const strategy = generateConfigJSON();

  //console.log("test! ce que je recois :", JSON.stringify(strategy, null, 2));

  return { instance, strategy };
}
// Fonction pour parser les statistiques
// de la réponse brute du solveur
// en un objet JavaScript
function parseStatistics(raw) {
  const stats = {};
  raw.split("\n").forEach(line => {
    const parts = line.split(";");
    if (parts.length === 2) {
      const key = parts[0].trim().replace(/\u200B/g, ""); // supprime ZWSP
      const value = parts[1].trim();
      // Convertir les nombres si possible
      stats[key] = isNaN(value) ? value : parseFloat(value);
    }
  });
  return stats;
}

// ==== Fonctions d'affichage ====

function afficherStatsSolution(solution, statistics) {
  const statsContainer = document.getElementById("solution-stats");
  statsContainer.innerHTML = '';

  // Calcul des statistiques
  const nbSessions = solution.sessions?.length || 0;
  //const nbGroupes = solution.groups?.length || 0;
  //const totalGroups = universityData.timetabling.solution.groups.length;
  const nbGroupes = universityData.timetabling.solution.groups.length || 0 ;
  const nbClasses = new Set(solution.sessions?.map(s => s.class)).size || 0;
  const nbTeachers = new Set(solution.sessions?.flatMap(s => s.teachers)).size || 0;
  const nbRooms = new Set(solution.sessions?.flatMap(s => s.rooms)).size || 0;

  const resolutionTime = parseFloat(statistics.getResolutionTime || 0).toFixed(3);
  const creationTime = parseFloat(statistics.getCreationTime?.toString().trim().replace(/[^\d.-]/g, '') || 0).toFixed(3);
  const totalTime = (parseFloat(resolutionTime) + parseFloat(creationTime)).toFixed(3);
  const efficiencyRatio = ((statistics.getNodeCount / statistics.getDecisionCount) || 0 ).toFixed(2);

  statsContainer.innerHTML = `
    <div class="stats-wrapper">
      <!-- Colonne Gauche - Résultats (inchangée) -->
      <div class="stats-column left-column">
        <h3 class="column-title">
          <i class="bi bi-calendar-week"></i> Résultats du planning
        </h3>
        <div class="stats-grid">
          ${[
            { label: "Séances planifiées", value: nbSessions, icon: "bi-calendar-event", color: "primary" },
            { label: "Groupes constitués", value: nbGroupes, icon: "bi-people", color: "success" },
            { label: "Classes", value: nbClasses, icon: "bi-journal-bookmark", color: "info" },
            { label: "Enseignants", value: nbTeachers, icon: "bi-person-badge", color: "warning" },
            { label: "Salles utilisées", value: nbRooms, icon: "bi-building", color: "danger" }
          ].map(stat => `
            <div class="stat-item bg-${stat.color}-subtle">
              <i class="bi ${stat.icon}"></i>
              <div class="stat-content">
                <span class="value">${stat.value}</span>
                <span class="label">${stat.label}</span>
              </div>
            </div>
          `).join('')}
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
          
          <!-- Nouvelle ligne pour les indicateurs clés -->
          <div class="key-indicators">
            <div class="indicator success">
              <i class="bi bi-check-circle"></i>
              <div>
                <div class="indicator-value">${statistics.getNrSolutions || 0}</div>
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
                <div class="indicator-value">${statistics.getFailCount || 0}</div>
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
                <div class="metric-detail">Profondeur: ${statistics.getCurrentDepth || 0}</div>
              </div>
            </div>
            
            <div class="metric-card">
              <i class="bi bi-arrow-left-right"></i>
              <div>
                <div class="metric-value">${statistics.getDecisionCount || 0}</div>
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
                <div class="metric-detail">${statistics.getNbIntVar || 0} int, ${statistics.getNbBoolVar || 0} bool</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}



// Partie sauvegarde de la solution
const saveButton = document.getElementById("save-solution");
const solutionNameInput = document.getElementById("solution-name");

// Gestionnaire pour le bouton "Enregistrer"
if (saveButton) {
    saveButton.addEventListener("click", async function() {
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
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sauvegarde...';


            const requestData = {
                name: solutionName,
            };

            // Utiliser l'endpoint pour renommer l'instance
            const response = await fetch(`http://localhost:8080/solver/${instance_id}/rename`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la sauvegarde: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log("Résultat de la sauvegarde:", result);
            
            // Afficher un message de succès
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