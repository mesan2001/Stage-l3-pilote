
document.addEventListener("DOMContentLoaded", function () {
  // Gestion du toggle pour afficher/masquer les listes de contraintes
  document.querySelectorAll(".toggle-button").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);

      // Toggle la classe 'show'
      targetElement.classList.toggle("show");

      // Mise à jour de l'icône (▲ pour ouvert, ▼ pour fermé)
      const expandIcon = this.querySelector(".expand-icon");
      if (targetElement.classList.contains("show")) {
        expandIcon.textContent = "▼"; // Icône fermée
      } else {
        expandIcon.textContent = "▲"; // Icône ouverte
      }
    });
  });
});


/*
fetch("http://localhost:8080/api/courses/")
    .then(response => response.json())
    .then(data => console.log("Calendars:", data))
    .catch(error => console.error("Erreur :", error));
*/

/* Gestion de la complétion des textes*/

// Sélection depuis le HTML

const searchInput = document.getElementById("instance-search"); // Barre de recherche
const suggestionsBox = document.getElementById("suggestions"); // Boîte des suggestions
const instanceSelect = document.getElementById("instance-type-filter"); // Select de formation
const periodContainer = document.getElementById("period-container"); // Conteneur des périodes
const periodSelect = document.getElementById("period-select"); // Select des périodes
const selectAllButton = document.getElementById("select-all"); // Bouton "Tout sélectionner"

// Liste des périodes par formation (basé sur l'API de Mr Simon)
// c'est ici ma question ( soit je recupère dynamiquement toutes les périodes ou semestre d'une formation par une requete fetch depuis l'API )
// niveau sécurité top car meme si l'API a été mis à jour , je ne risque pas de changer mon js
// inconévient plusieur requettes ( puisque je vais de toute facon refaire une autre requete apres la selection des périodes pour avoir la data de la période)
const periodsByFormation = {
  "L2 Informatique": ["P1", "P2", "P3", "P4", "P5"],
  "L2 Mathématiques": ["P1", "P2", "P3", "P4"],
  "L3 Informatique": ["P1", "P2", "P3", "P4", "P5", "P6"],
};

// Sélectionne toutes les options du <select> (sauf "all")
function getInstancesFromSelect() {
  return Array.from(instanceSelect.options)
    .map(option => option.value)
    .filter(value => value !== "all");
}

// mise à jour des périodes affichées en fonction de la formation sélectionnée
function updatePeriods(selectedFormation) {
  //  liste toutes les périodes d'une formations (tableau vide sinon)
  const periods = periodsByFormation[selectedFormation] || []; 
  
  // Vider l'affichage des périodes 
  periodSelect.innerHTML = ""; 
  // si la formation sélectionné contient des periodes (ou semestre) alors on ajoute ces périodes en options , une affichage vide sinon
  if (periods.length > 0) {
    periodContainer.style.display = "block";
    periods.forEach(period => {
      let option = document.createElement("option");
      option.value = period;
      option.textContent = period;
      periodSelect.appendChild(option);
    });
  } else {
    periodContainer.style.display = "none";
  }
}

// Gestion de la saisie dans la barre de recherche ( pour faire des suggestions)
searchInput.addEventListener("input", function () {
  //  Kenny , Thi Vi , je fais toLowerCase ici pour faire une comparaison uniforme ( l3 info == L3 INFO)
  const query = this.value.trim().toLowerCase();
  // suggestionsBox est la div qui va se charger d'afficher les suggestions
  suggestionsBox.innerHTML = "";

  if (query.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  const instances = getInstancesFromSelect(); // tableau contenant toutes les instances
  const filteredInstances = instances.filter(inst => inst.toLowerCase().startsWith(query));

  if (filteredInstances.length > 0) {
    suggestionsBox.style.display = "block";
    filteredInstances.forEach(inst => {
      const suggestionItem = document.createElement("div");
      suggestionItem.classList.add("suggestion");
      suggestionItem.textContent = inst;

      suggestionItem.addEventListener("click", function () {
        searchInput.value = inst;
        instanceSelect.value = inst;
        updatePeriods(inst);
        suggestionsBox.style.display = "none";
      });

      suggestionsBox.appendChild(suggestionItem);
    });
  } else {
    suggestionsBox.style.display = "none";
  }
});

//  les suggestions sont masquées quand on clique ailleurs
document.addEventListener("click", function (e) {
  if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.style.display = "none";
  }
});

// Mise à jour des périodes lors de la sélection d'une formation dans le <select>
instanceSelect.addEventListener("change", function () {
  updatePeriods(instanceSelect.value);
});

// Sélectionner toutes les périodes disponibles
selectAllButton.addEventListener("click", function () {
  for (let option of periodSelect.options) {
    option.selected = true;
  }
});
