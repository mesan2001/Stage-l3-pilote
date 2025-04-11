// Lancement du solveur (simulateur de délai 3s)
document.getElementById("start-solver").addEventListener("click", () => {
  setTimeout(() => {
    chargerResultatSolveur();
  }, 3000);
});

// Fonction principale : chargement + affichage du résultat
async function chargerResultatSolveur() {
  const solverStatus = document.getElementById("solver-status");
  const elapsedElem = document.getElementById("elapsed-time");
  const preview = document.getElementById("timetable-preview");

  const startTime = performance.now();

  if (solverStatus) {
    solverStatus.textContent = "En cours...";
    solverStatus.className = "badge bg-warning";
  }

  try {
    const response = await fetch("http://localhost:5000/api/solveur/resultat");
    const json = await response.json();
    const endTime = performance.now();

    // Temps côté client par défaut
    let elapsed = ((endTime - startTime) / 1000).toFixed(2);
    if (json.elapsedTime !== undefined) {
      elapsed = parseFloat(json.elapsedTime).toFixed(2);
    }

    if (json && json.solution) {
      afficherStatsSolution(json.solution);
      afficherEmploiDuTemps(json.solution);

      if (solverStatus) {
        solverStatus.textContent = "Terminé";
        solverStatus.className = "badge bg-success";
      }

      if (elapsedElem) {
        elapsedElem.textContent = `${elapsed}s`;
      }

      document.getElementById("results-content").style.display = "block";

      const exportBtn = document.getElementById("export-solution");
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.addEventListener("click", () => exporterSolutionJSON(json));
      }
    } else {
      throw new Error("Aucune solution trouvée dans la réponse.");
    }

  } catch (error) {
    console.error("Erreur lors du chargement du résultat :", error);

    if (solverStatus) {
      solverStatus.textContent = "Échec";
      solverStatus.className = "badge bg-danger";
    }

    if (elapsedElem) {
      elapsedElem.textContent = `0.00s`;
    }

    if (preview) {
      preview.innerHTML = `<p class="text-danger fw-bold">Erreur de chargement : ${error.message}</p>`;
    }

    document.getElementById("results-content").style.display = "block";
  }
}

// Affichage des statistiques
function afficherStatsSolution(solution) {
  const statsContainer = document.getElementById("solution-stats");
  statsContainer.innerHTML = "";

  const nbSessions = solution.sessions ? solution.sessions.length : 0;
  const nbGroupes = solution.groups ? solution.groups.length : 0;
  const nbClasses = new Set(solution.sessions.map(s => s.class)).size;
  const nbTeachers = new Set(solution.sessions.flatMap(s => s.teachers)).size;
  const nbRooms = new Set(solution.sessions.flatMap(s => s.rooms)).size;

  const stats = [
    { label: "Séances planifiées", value: nbSessions },
    { label: "Groupes d'étudiants", value: nbGroupes },
    { label: "Classes différentes", value: nbClasses },
    { label: "Enseignants assignés", value: nbTeachers },
    { label: "Salles utilisées", value: nbRooms }
  ];

  stats.forEach(stat => {
    const div = document.createElement("div");
    div.className = "col-md-4 mb-3";
    div.innerHTML = `
      <div class="card shadow-sm border-info">
        <div class="card-body text-center">
          <h5 class="card-title">${stat.value}</h5>
          <p class="card-text text-muted">${stat.label}</p>
        </div>
      </div>
    `;
    statsContainer.appendChild(div);
  });
}

// Affichage des séances et groupes
function afficherEmploiDuTemps(solution) {
  const container = document.getElementById("timetable-preview");
  container.innerHTML = "";

  if (!solution.sessions || solution.sessions.length === 0) {
    container.innerHTML = "<p>Aucune session trouvée dans la solution.</p>";
    return;
  }

  const sessionsHeader = document.createElement("h5");
  sessionsHeader.textContent = " Séances programmées :";
  container.appendChild(sessionsHeader);

  solution.sessions.forEach(session => {
    const div = document.createElement("div");
    div.className = "card mb-2";
    div.innerHTML = `
      <div class="card-body">
        <h6 class="card-title">${session.class} — Séance n°${session.num}</h6>
        <p class="card-text">
          <strong>Rang :</strong> ${session.rank}<br>
          <strong>Jour :</strong> ${session.startingSlot.day} (semaine ${session.startingSlot.week})<br>
          <strong>Créneau :</strong> ${session.startingSlot.dailySlot} min (slot ${session.startingSlot.slot})<br>
          <strong>Salle(s) :</strong> ${session.rooms.join(", ")}<br>
          <strong>Enseignant(s) :</strong> ${session.teachers.join(", ")}
        </p>
      </div>
    `;
    container.appendChild(div);
  });

  if (solution.groups && solution.groups.length > 0) {
    const groupsHeader = document.createElement("h5");
    groupsHeader.textContent = " Groupes d'étudiants :";
    container.appendChild(groupsHeader);

    solution.groups.forEach(group => {
      const div = document.createElement("div");
      div.className = "card mb-2";
      div.innerHTML = `
        <div class="card-body">
          <h6 class="card-title">Groupe : ${group.id}</h6>
          <p class="card-text">
            <strong>Effectif :</strong> ${group.headcount}<br>
            <strong>Étudiants :</strong> ${group.students.join(", ")}<br>
            <strong>Classes :</strong> ${group.classes.join(", ")}
          </p>
        </div>
      `;
      container.appendChild(div);
    });
  }
}

// Export JSON
function exporterSolutionJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "solution_emploi_du_temps.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
