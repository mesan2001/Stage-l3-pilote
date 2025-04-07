document.addEventListener("DOMContentLoaded", function () {
  // Gestion des collapses et toggles 
  document.querySelectorAll('[data-bs-toggle="collapse"]').forEach((button) => {
    const targetId = button.getAttribute("data-bs-target");
    const targetElement = document.querySelector(targetId);

    // Mettre à jour l'icône initiale en fonction de l'état
    const updateIcon = (isExpanded) => {
      const icon = button.querySelector(".expand-icon");
      if (icon) {
        icon.textContent = isExpanded ? "▲" : "▼";
      }
    };

    // Initialiser l'icône au chargement
    if (targetElement) {
      updateIcon(targetElement.classList.contains("show"));

      //Observer les changements d'état du collapse
      targetElement.addEventListener("show.bs.collapse", () =>
        updateIcon(true)
      );
      targetElement.addEventListener("hide.bs.collapse", () =>
        updateIcon(false)
      );
    }
  });

  //Gestion du mode avancé 
  const advancedModeToggle = document.getElementById("advanced-mode-toggle");
  const advancedModeSection = document.getElementById("advanced-mode-section");

  if (advancedModeToggle && advancedModeSection) {
    advancedModeToggle.addEventListener("change", function () {
      if (this.checked) {
        advancedModeSection.style.display = "block";
        // Générer le JSON à partir du formulaire actuel
        generateConfigJSON();
      } else {
        advancedModeSection.style.display = "none";
      }
    });
  }

  initializeExistingStrategies();

  // Bouton pour ajouter une nouvelle stratégie
  const addStrategyBtn = document.getElementById("add-strategy");
  if (addStrategyBtn) {
    addStrategyBtn.addEventListener("click", addNewStrategy);
  }

  // Fonction pour générer le JSON de configuration 
  function generateConfigJSON() {
    const config = {
      time_out: document.getElementById("time-out").value + "s",
      vars: getVarsStrategies(),
      core_constraint: [],
      user_constraint: [],
      deactivate_rules: [],
    };

    // Récupérer les contraintes fondamentales cochées
    document
      .querySelectorAll('#core-constraints-list input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        config.core_constraint.push(checkbox.value);
      });

    // Récupérer les contraintes métier cochées
    document
      .querySelectorAll('#user-constraints-list input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        config.user_constraint.push(checkbox.value);
      });

    // Récupérer les règles désactivées
    const deactivateRulesInput = document.getElementById("deactivate-rules");
    if (deactivateRulesInput && deactivateRulesInput.value) {
      config.deactivate_rules.push({
        rules: deactivateRulesInput.value,
        comment: "Règles désactivées par l'utilisateur",
      });
    }

    // Mettre à jour le textarea JSON
    const jsonTextarea = document.getElementById("advanced-config-json");
    if (jsonTextarea) {
      jsonTextarea.value = JSON.stringify(config, null, 2);
    }

    return config;
  }

  // Fonction pour récupérer les stratégies des variables
  function getVarsStrategies() {
    const strategies = [];
    const strategyContainers = document.querySelectorAll(".strategy-container");

    strategyContainers.forEach((container) => {
      const variableType = container.querySelector(".variable-type").value;
      const selectorType = container.querySelector(".selector-type").value;
      const selectorValue = container.querySelector(".selector-value").value;
      const orderStrategy = container.querySelector(".order-strategy").value;
      const domainStrategy = container.querySelector(".domain-strategy").value;

      // Créer l'objet stratégie
      const strategyObj = {};
      strategyObj[variableType] = [
        { [selectorType]: selectorValue },
        orderStrategy,
        domainStrategy,
      ];

      strategies.push(strategyObj);
    });

    return strategies;
  }


  function initializeExistingStrategies() {

  }

  // Fonction pour ajouter une nouvelle stratégie
  function addNewStrategy() {
    const container = document.createElement("div");
    container.className = "strategy-container";

    // Créer le contenu de la stratégie
    container.innerHTML = `
      <div class="strategy-header">
        <h5>Stratégie de variable</h5>
        <button type="button" class="btn btn-sm btn-danger remove-strategy">Supprimer</button>
      </div>
      <div class="strategy-fields">
        <div class="mb-2">
          <label class="form-label">Type de variable:</label>
          <select class="form-select variable-type">
            <option value="x_room">x_room</option>
            <option value="x_rooms">x_rooms</option>
            <option value="x_teacher">x_teacher</option>
            <option value="x_teachers">x_teachers</option>
            <option value="x_slot">x_slot</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Type de sélecteur:</label>
          <select class="form-select selector-type">
            <option value="rank">rank</option>
            <option value="label">label</option>
            <option value="id">id</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Valeur du sélecteur:</label>
          <input type="text" class="form-control selector-value" placeholder="ex: *, 1-5, L1">
        </div>
        <div class="mb-2">
          <label class="form-label">Stratégie d'ordre:</label>
          <select class="form-select order-strategy">
            <option value="input_order">input_order</option>
            <option value="first_fail">first_fail</option>
            <option value="anti_first_fail">anti_first_fail</option>
            <option value="dom_w_deg">dom_w_deg</option>
            <option value="activity_based">activity_based</option>
            <option value="max_regret">max_regret</option>
            <option value="conflict_history">conflict_history</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Stratégie de parcours:</label>
          <select class="form-select domain-strategy">
            <option value="indomain_min">indomain_min</option>
            <option value="indomain_max">indomain_max</option>
            <option value="indomain_random">indomain_random</option>
            <option value="indomain_median">indomain_median</option>
            <option value="indomain_middle">indomain_middle</option>
          </select>
        </div>
      </div>
    `;

    //ajouter au conteneur principal
    const varsStrategies = document.getElementById("vars-strategies");
    if (varsStrategies) {
      varsStrategies.appendChild(container);
    }

    //ajouter un gestionnaire pour le bouton de suppression
    const removeButton = container.querySelector(".remove-strategy");
    if (removeButton) {
      removeButton.addEventListener("click", function () {
        container.remove();
      });
    }
  }

  // gestion de la sauvegarde de configuration 
  const saveConfigBtn = document.getElementById("save-config");
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener("click", function () {
      // Générer le JSON de configuration
      let configData = generateConfigJSON();

      // Si mode avancé activé, tenter de parser le JSON saisi
      const advancedModeActive =
        advancedModeToggle && advancedModeToggle.checked;
      if (advancedModeActive) {
        try {
          const jsonTextarea = document.getElementById("advanced-config-json");
          if (jsonTextarea) {
            configData = JSON.parse(jsonTextarea.value);
          }
        } catch (e) {
          alert("Erreur de format JSON: " + e.message);
          return;
        }
      }

      // Créer un nom de fichier avec date
      const date = new Date();
      const fileName = `solver-config-${date.getFullYear()}${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}.json`;

      // Créer le lien de téléchargement
      const dataStr = JSON.stringify(configData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportLink = document.createElement("a");
      exportLink.setAttribute("href", dataUri);
      exportLink.setAttribute("download", fileName);
      document.body.appendChild(exportLink);
      exportLink.click();
      document.body.removeChild(exportLink);
    });
  }



  //gestion du chargement de configuration 
  const loadConfigBtn = document.getElementById("load-config-btn");
  const configFileInput = document.getElementById("config-file-input");

  if (loadConfigBtn && configFileInput) {
    loadConfigBtn.addEventListener("click", function () {
      configFileInput.click();
    });

    configFileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const config = JSON.parse(e.target.result);
          loadConfigIntoForm(config);
        } catch (e) {
          alert("Erreur lors de la lecture du fichier: " + e.message);
        }
      };
      reader.readAsText(file);
    });
  }



  ////  Fonction pour charger la config dans le formulaire 
  function loadConfigIntoForm(config) {
    // Activer le mode avancé pour montrer le JSON
    if (advancedModeToggle && advancedModeSection) {
      advancedModeToggle.checked = true;
      advancedModeSection.style.display = "block";
    }

    // Afficher le JSON dans le textarea
    const jsonTextarea = document.getElementById("advanced-config-json");
    if (jsonTextarea) {
      jsonTextarea.value = JSON.stringify(config, null, 2);
    }

    // Remplir le formulaire avec les valeurs
    const timeoutInput = document.getElementById("time-out");
    if (timeoutInput && config.time_out) {
      const timeValue = config.time_out.replace("s", "");
      timeoutInput.value = timeValue;
    }

    // Réinitialiser toutes les checkboxes
    document
      .querySelectorAll('#core-constraints-list input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });
    document
      .querySelectorAll('#user-constraints-list input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    // Cocher les contraintes fondamentales
    if (config.core_constraint) {
      config.core_constraint.forEach((constraint) => {
        const checkbox = document.getElementById("core-" + constraint);
        if (checkbox) checkbox.checked = true;
      });
    }

    // Cocher les contraintes métier
    if (config.user_constraint) {
      config.user_constraint.forEach((constraint) => {
        const checkbox = document.getElementById("user-" + constraint);
        if (checkbox) checkbox.checked = true;
      });
    }

    // Règles désactivées
    const deactivateRulesInput = document.getElementById("deactivate-rules");
    if (
      deactivateRulesInput &&
      config.deactivate_rules &&
      config.deactivate_rules.length > 0 &&
      config.deactivate_rules[0].rules
    ) {
      deactivateRulesInput.value = config.deactivate_rules[0].rules;
    }

  }

  //  recherche dans les contraintes métier  
  const userConstraintsSearch = document.getElementById(
    "user-constraints-search"
  );
  if (userConstraintsSearch) {
    userConstraintsSearch.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const constraints = document.querySelectorAll(
        "#user-constraints-list .constraint-item"
      );

      let hasVisibleItems = false;
      constraints.forEach((constraint) => {
        const label = constraint.querySelector("label");
        if (label) {
          const labelText = label.textContent.toLowerCase();
          if (labelText.includes(searchTerm)) {
            constraint.style.display = "";
            hasVisibleItems = true;
          } else {
            constraint.style.display = "none";
          }
        }
      });

      // qfficher un message si aucun résultat
      let noResultsMessage = document.getElementById("no-results-message");
      if (!hasVisibleItems) {
        if (!noResultsMessage) {
          noResultsMessage = document.createElement("div");
          noResultsMessage.id = "no-results-message";
          noResultsMessage.className = "alert alert-info mt-2";
          noResultsMessage.textContent = "Aucun résultat trouvé";
          const constraintsList = document.getElementById(
            "user-constraints-list"
          );
          if (constraintsList) {
            constraintsList.appendChild(noResultsMessage);
          }
        } else {
          noResultsMessage.style.display = "";
        }
      } else if (noResultsMessage) {
        noResultsMessage.style.display = "none";
      }
    });
  }

  ////  Gestion du lancement du solveur 
  const startSolverBtn = document.getElementById("start-solver");
  if (startSolverBtn) {
    startSolverBtn.addEventListener("click", function () {
      // Afficher la section résultats
      const resultsContent = document.getElementById("results-content");
      if (resultsContent) {
        resultsContent.style.display = "block";
      }

      // Mettre à jour le statut
      const solverStatus = document.getElementById("solver-status");
      if (solverStatus) {
        solverStatus.textContent = "En cours...";
        solverStatus.className = "badge bg-warning";
      }

      // Réinitialiser la barre de progression
      const progressBar = document.getElementById("solver-progress");
      if (progressBar) {
        progressBar.style.width = "0%";
        progressBar.setAttribute("aria-valuenow", "0");
      }

      // Simuler la progression
      let progress = 0;
      const elapsedTime = document.getElementById("elapsed-time");
      let startTime = Date.now();


    });
  }

  
  // Mettre à jour le compteur d'instances sélectionnées
  function updateSelectedInstancesCount() {
    const selectedCount = document.querySelectorAll(
      ".instance-checkbox:checked"
    ).length;
    const countDisplay = document.getElementById("selected-instances-count");
    const infoDiv = document.getElementById("selected-instances-info");

    if (countDisplay && infoDiv) {
      countDisplay.textContent = selectedCount;
      infoDiv.style.display = selectedCount > 0 ? "block" : "none";
    }
  }
});
