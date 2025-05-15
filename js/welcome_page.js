/*// Description: Script pour la page d'accueil de l'application
// Il gère l'affichage de l'écran d'accueil, la navigation vers l'application principale,
// le chargement des configurations existantes et l'affichage des détails de la configuration sélectionnée.
*/
document.addEventListener("DOMContentLoaded", function() {
  // Éléments DOM
  const welcomeScreen = document.getElementById("welcome-screen");
  const mainApp = document.querySelector("main.container");
  const newConfigBtn = document.getElementById("new-config");
  const loadConfigBtn = document.getElementById("load-existing-config");
  const configList = document.getElementById("config-list");
  const confirmLoadBtn = document.getElementById("confirm-load-config");

  /*
  // Fonction pour initialiser l'écran d'accueil
  // Cette fonction configure l'écran d'accueil pour qu'il soit centré et occupe toute la hauteur de la fenêtre
  // et masque l'application principale.
  // Elle est appelée lors du chargement de la page et lors de la navigation vers l'écran d'accueil.
  */
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

  // Fonction pour naviguer vers l'application principale
  // Cette fonction masque l'écran d'accueil et affiche l'application principale.
  // Elle est appelée lors de la sélection d'une nouvelle configuration ou du chargement d'une configuration existante.
  function navigateToApp() {
    welcomeScreen.style.display = "none";
    mainApp.style.display = "block";
    window.history.pushState({ screen: "app" }, "", "");
  }

  // Fonction pour charger les données de l'instance et de la stratégie
  // Cette fonction est appelée lors du chargement d'une configuration existante.
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.screen === "welcome") {
      initWelcomeScreen();
    } else {
      welcomeScreen.style.display = "none";
      mainApp.style.display = "block";
    }
  });

  // Au chargement de la page, on initialise l'écran d'accueil
  // et on remplace l'état de l'historique pour éviter de revenir à l'écran d'accueil.
  // On ajoute un écouteur d'événements pour gérer la navigation avec le bouton "Précédent" du navigateur.
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
  /*
  // Bouton "Charger une configuration existante"
  // Ce bouton ouvre une modale pour sélectionner une configuration existante.
  // Il charge les configurations depuis le serveur et les affiche dans une liste déroulante.
  // Lorsqu'une configuration est sélectionnée, elle affiche les détails de la configuration
  // et active le bouton "Charger" pour charger la configuration sélectionnée.
  // Il gère également l'affichage d'un message indiquant si une solution existe déjà pour la configuration sélectionnée.
  */
  if (loadConfigBtn) {
    loadConfigBtn.addEventListener("click", function() {
      const loadConfigModal = new bootstrap.Modal(
        document.getElementById("load-config-modal")
      );
      loadConfigModal.show();
      
      // l'endpoint localhost:8080/solver/all est appelé pour récupérer toutes les configurations existantes
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
            
            // Vérifier si une solution existe
            const hasSolution = config.solution_path !== null && config.status === "FINISHED";
            
            option.textContent = (config.name || `Configuration ${config.id}`) + 
                                (hasSolution ? " ✅ (solution disponible)" : " ❌ (pas de solution)");
            
            option.dataset.details = JSON.stringify({
              ...config,
              hasSolution: hasSolution
            });
            configList.appendChild(option);
          });
        })
        .catch(error => {
          console.error("Erreur:", error);
          configList.innerHTML = '<option value="" disabled selected>Erreur de chargement</option>';
        });
    });
  }
  /*
  // Fonction pour formater la date actuelle 
  // Cette fonction est utilisée pour afficher la date de création de la configuration
  // dans le format "JJ/MM/AAAA".
  // cette fonctionnalité n'est pas encore ajouté dans l'api
  // on unitilise une date par défaut pour la configuration( la date actuelle)
  // on peut l'ajouter dans le futur
  */
  function formatCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (configList) {
    configList.addEventListener("change", function() {
      const selectedOption = this.options[this.selectedIndex];
      if (!selectedOption.value) return;
      
      const config = JSON.parse(selectedOption.dataset.details);
      document.getElementById("config-name").textContent = config.name || "Non défini";
      document.getElementById("config-date").textContent = config.date || formatCurrentDate();
      
      // Afficher les détails de la configuration

      const solutionInfo = document.createElement("small");
      solutionInfo.className = "text-muted d-block";
      solutionInfo.textContent = config.hasSolution 
        ? "⚠️ Une solution existe déjà pour cette configuration" 
        : "Aucune solution existante pour cette configuration";
      
      const detailsDiv = document.getElementById("config-details");
      detailsDiv.classList.remove("d-none");
      
      const existingSolutionInfo = detailsDiv.querySelector(".solution-info");
      if (existingSolutionInfo) existingSolutionInfo.remove();
      
      solutionInfo.classList.add("solution-info");
      detailsDiv.appendChild(solutionInfo);
      
      confirmLoadBtn.disabled = false;
      this.dataset.selectedConfig = JSON.stringify(config);
    });
  }
  /*
  // Bouton "Charger la configuration"
  // Ce bouton est activé lorsque l'utilisateur sélectionne une configuration existante.
  // Lorsqu'il est cliqué, il charge les données de l'instance et de la stratégie
  // et initialise l'interface utilisateur avec ces données.
  // Il gère également le chargement de la solution si elle existe déjà.  
  */
  if (confirmLoadBtn) {
    confirmLoadBtn.addEventListener("click", function() {
      const selectedConfig = JSON.parse(configList.dataset.selectedConfig || "{}");
      if (!selectedConfig.id) return;
  
      const loadConfigModal = bootstrap.Modal.getInstance(
        document.getElementById("load-config-modal")
      );
      loadConfigModal.hide();
  
      navigateToApp();
  
      // Charger les données de l'instance et de la stratégie
      Promise.all([
        fetch(`http://localhost:8080/solver/${selectedConfig.id}/instance`),
        fetch(`http://localhost:8080/solver/${selectedConfig.id}/strategy`)
      ])
      .then(async ([instanceRes, strategyRes]) => {
        if (!instanceRes.ok || !strategyRes.ok) throw new Error("Erreur de chargement");
        return Promise.all([instanceRes.json(), strategyRes.json()]);
      })
      .then(async ([instanceData, strategyData]) => {
        initUIWithData(instanceData.instance);
        loadConfigIntoForm(strategyData.strategy);
  
        // Si une solution existe, la charger
        if (selectedConfig.hasSolution) {
          try {
            await chargerResultatSolveur(selectedConfig.id);
            
            // Activer l'onglet des résultats si disponible
            const resultsTab = document.getElementById("results-tab");
            if (resultsTab) {
              new bootstrap.Tab(resultsTab).show();
            }
          } catch (error) {
            console.error("Erreur lors du chargement de la solution:", error);
          }
        }
  
        // Générer le XML et mettre à jour generatedData pour le téléchargement
        generateCompleteTimetabling()
          .then(xmlContent => {
            generatedData = {
              xml: xmlContent,
              json: {
                instance: instanceData.instance,
                strategy: strategyData.strategy
              }
            };
          })
          .catch(error => {
            console.error("Erreur lors de la génération du XML:", error);
            generatedData = {
              xml: null,
              json: {
                instance: instanceData.instance,
                strategy: strategyData.strategy
              }
            };
          });
  
        // Vérification de l'existence de l'onglet avant de l'activer
        const rulesTabElement = document.getElementById("rules-tab");
        if (rulesTabElement) {
          if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            new bootstrap.Tab(rulesTabElement).show();
          } else {
            console.error("Bootstrap Tab n'est pas disponible");
            rulesTabElement.classList.add("active");
          }
        }
      })
      .catch(error => console.error("Erreur:", error));
    });
  }
});
