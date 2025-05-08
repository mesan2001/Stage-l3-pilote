/*document.addEventListener("DOMContentLoaded", function () {
  // Éléments DOM communs
  const welcomeScreen = document.getElementById("welcome-screen");
  const mainApp = document.querySelector("main.container");
  const newConfigBtn = document.getElementById("new-config");
  const loadConfigBtn = document.getElementById("load-existing-config");

  // Éléments modale
  const configList = document.getElementById("config-list");
  const configDetails = document.getElementById("config-details");
  const configName = document.getElementById("config-name");
  const configDate = document.getElementById("config-date");
  //const configFormations = document.getElementById("config-formations");
  const confirmLoadBtn = document.getElementById("confirm-load-config");

  // Masquer l'application principale au départ
  if (mainApp && welcomeScreen) {
    mainApp.style.display = "none";
  }

  //  Bouton "Nouvelle configuration"
  if (newConfigBtn) {
    newConfigBtn.addEventListener("click", function () {
      welcomeScreen.style.display = "none";
      if (mainApp) {
        mainApp.style.display = "block";
      }
      const selectionTab = document.getElementById("selection-tab");
      if (selectionTab) {
        const tabTrigger = new bootstrap.Tab(selectionTab);
        tabTrigger.show();
      }
    });
  }

  // Bouton "Charger une configuration existante"
  if (loadConfigBtn) {
    loadConfigBtn.addEventListener("click", function () {
      console.log("Bouton 'Configuration existante' cliqué");

      if (welcomeScreen) {
        welcomeScreen.style.display = "none";
      }

      // Afficher la modale
      const loadConfigModal = new bootstrap.Modal(
        document.getElementById("load-config-modal")
      );
      loadConfigModal.show();

      // Réinitialiser la liste
      configList.innerHTML =
        '<option value="" selected disabled>-- Sélectionnez une configuration --</option>';
      configDetails.classList.add("d-none");
      confirmLoadBtn.disabled = true;

      // Charger les configs depuis le backend
      fetch("http://localhost:8080/solver/all")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur lors du chargement des configurations.");
          }
          return response.json();
        })
        .then((data) => {
          data.forEach((config) => {
            const option = document.createElement("option");
            option.value = config.id;
            option.textContent = config.name || `Configuration ${config.id}`;
            option.dataset.details = JSON.stringify(config);
            configList.appendChild(option);
          });
        })
        .catch((error) => {
          console.error(
            "Erreur lors de la récupération des configurations :",
            error
          );
          configList.innerHTML =
            '<option value="" disabled selected>Erreur de chargement</option>';
        });
    });
  }

  // ➤ Sélection dans la liste déroulante
  if (configList) {
    configList.addEventListener("change", function () {
      const selectedOption = configList.options[configList.selectedIndex];
      const config = JSON.parse(selectedOption.dataset.details);

      // Afficher les détails
      configName.textContent = config.name || "Non défini";
      configDate.textContent = config.date || "Non définie";
      //configFormations.textContent = (config.formations || []).join(", ");

      configDetails.classList.remove("d-none");
      confirmLoadBtn.disabled = false;

      // Stocker la config choisie temporairement
      configList.dataset.selectedConfig = JSON.stringify(config);
    });
  }

  //  Bouton "Charger"
  if (confirmLoadBtn) {
    confirmLoadBtn.addEventListener("click", function () {
        const selectedConfig = JSON.parse(configList.dataset.selectedConfig || "{}");
        const instanceId = selectedConfig.id;

        if (!instanceId) {
            console.error("ID de configuration introuvable.");
            return;
        }

        // Fermer la modale
        const loadConfigModal = bootstrap.Modal.getInstance(document.getElementById("load-config-modal"));
        loadConfigModal.hide();

        // Afficher l'application principale
        if (mainApp) {
            mainApp.style.display = "block";
        }

        // Activer l'onglet de sélection
        const selectionTab = document.getElementById("selection-tab");
        if (selectionTab) {
            const tabTrigger = new bootstrap.Tab(selectionTab);
            tabTrigger.show();
        }

        // Récupérer les données d'instance
        fetch(`http://localhost:8080/solver/${instanceId}/instance`)
            .then(res => res.json())
            .then(instanceData => {
                console.log("Données de l'instance je suis là :", instanceData.instance);
                
                //universityData = instanceData.instance ;
                initUIWithData(instanceData.instance);

                // Activez aussi l'onglet des règles
                const rulesTab = document.getElementById("rules-tab");
                if (rulesTab) {
                    const tabTrigger = new bootstrap.Tab(rulesTab);
                    tabTrigger.show();
                }

            })
            .catch(error => {
                console.error("Erreur lors de la récupération de l'instance :", error);
            });

        // Récupérer les données de stratégie
        fetch(`http://localhost:8080/solver/${instanceId}/strategy`)
            .then(res => res.json())
            .then(strategyData => {
                console.log("Données de la stratégie :", strategyData.strategy);
                loadConfigIntoForm(strategyData.strategy);
            })
            .catch(error => {
                console.error("Erreur lors de la récupération de la stratégie :", error);
            });
    });
}

});*/


document.addEventListener("DOMContentLoaded", function() {
  // Éléments DOM
  const welcomeScreen = document.getElementById("welcome-screen");
  const mainApp = document.querySelector("main.container");
  const newConfigBtn = document.getElementById("new-config");
  const loadConfigBtn = document.getElementById("load-existing-config");
  const configList = document.getElementById("config-list");
  const confirmLoadBtn = document.getElementById("confirm-load-config");

  // Initialisation de la position
  function initWelcomeScreen() {
    if (welcomeScreen) {
      welcomeScreen.style.display = "flex";
      welcomeScreen.style.justifyContent = "center";
      welcomeScreen.style.alignItems = "center";
      welcomeScreen.style.minHeight = "100vh";
      welcomeScreen.style.flexDirection = "column";
    }
    if (mainApp) {
      mainApp.style.display = "none";
    }
  }

  // Gestion de la navigation
  function navigateToApp() {
    welcomeScreen.style.display = "none";
    mainApp.style.display = "block";
    window.history.pushState({ screen: "app" }, "", "");
  }

  function navigateToWelcome() {
    initWelcomeScreen();
    window.history.pushState({ screen: "welcome" }, "", "");
  }

  // Gestion du bouton retour navigateur
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.screen === "welcome") {
      initWelcomeScreen();
    } else {
      welcomeScreen.style.display = "none";
      mainApp.style.display = "block";
    }
  });

  // Initialisation au chargement
  initWelcomeScreen();
  window.history.replaceState({ screen: "welcome" }, "", "");

  // Bouton "Nouvelle configuration"
  if (newConfigBtn) {
    newConfigBtn.addEventListener("click", function() {
      navigateToApp();
      const selectionTab = document.getElementById("selection-tab");
      if (selectionTab) new bootstrap.Tab(selectionTab).show();
    });
  }

  // Bouton "Charger une configuration existante"
  if (loadConfigBtn) {
    loadConfigBtn.addEventListener("click", function() {
      const loadConfigModal = new bootstrap.Modal(
        document.getElementById("load-config-modal")
      );
      loadConfigModal.show();
      
      // Charger les configurations
      fetch("http://localhost:8080/solver/all")
        .then(response => {
          if (!response.ok) throw new Error("Erreur de chargement");
          return response.json();
        })
        .then(data => {
          configList.innerHTML = '<option value="" selected disabled>-- Sélectionnez une configuration --</option>';
          data.forEach(config => {
            const option = document.createElement("option");
            option.value = config.id;
            option.textContent = config.name || `Configuration ${config.id}`;
            option.dataset.details = JSON.stringify(config);
            configList.appendChild(option);
          });
        })
        .catch(error => {
          console.error("Erreur:", error);
          configList.innerHTML = '<option value="" disabled selected>Erreur de chargement</option>';
        });
    });
  }
  // Fonction pour formater la date ( pas d'importance ici )
  function formatCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }
  // Gestion de la sélection dans la liste
  if (configList) {
    configList.addEventListener("change", function() {
      const selectedOption = this.options[this.selectedIndex];
      if (!selectedOption.value) return;
      
      const config = JSON.parse(selectedOption.dataset.details);
      document.getElementById("config-name").textContent = config.name || "Non défini";
      document.getElementById("config-date").textContent = config.date || formatCurrentDate();
      document.getElementById("config-details").classList.remove("d-none");
      confirmLoadBtn.disabled = false;
      this.dataset.selectedConfig = JSON.stringify(config);
    });
  }

  // Bouton "Charger" dans la modale
  if (confirmLoadBtn) {
    confirmLoadBtn.addEventListener("click", function() {
      const selectedConfig = JSON.parse(configList.dataset.selectedConfig || "{}");
      if (!selectedConfig.id) return;
  
      const loadConfigModal = bootstrap.Modal.getInstance(
        document.getElementById("load-config-modal")
      );
      loadConfigModal.hide();
  
      navigateToApp();
  
      // Chargement des données
      Promise.all([
        fetch(`http://localhost:8080/solver/${selectedConfig.id}/instance`),
        fetch(`http://localhost:8080/solver/${selectedConfig.id}/strategy`)
      ])
      .then(async ([instanceRes, strategyRes]) => {
        if (!instanceRes.ok || !strategyRes.ok) throw new Error("Erreur de chargement");
        return Promise.all([instanceRes.json(), strategyRes.json()]);
      })
      .then(([instanceData, strategyData]) => {
        initUIWithData(instanceData.instance);
        loadConfigIntoForm(strategyData.strategy);
        
        // Vérification de l'existence de l'onglet avant de l'activer
        const rulesTabElement = document.getElementById("rules-tab");
        if (rulesTabElement) {
          // Vérification supplémentaire que Bootstrap est chargé
          if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            new bootstrap.Tab(rulesTabElement).show();
          } else {
            console.error("Bootstrap Tab n'est pas disponible");
            rulesTabElement.classList.add("active"); // Solution de repli
          }
        }
      })
      .catch(error => console.error("Erreur:", error));
    });
  }
});
